<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Genero;
use App\Models\Licencia;
use App\Models\Notificacion;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use getID3;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class CancionController extends Controller
{
    public function index()
    {
        $usuarioAutenticado = Auth::user();

        $query = Cancion::with(['usuarios' => function ($query) {
            $query->withPivot('propietario');
        }])->latest();

        if ($usuarioAutenticado) {
            $query->where(function ($q) use ($usuarioAutenticado) {
                $q->where('publico', true)
                  ->orWhereHas('usuarios', function ($q2) use ($usuarioAutenticado) {
                      $q2->where('user_id', $usuarioAutenticado->id);
                  });
            });
        } else {
            $query->where('publico', true);
        }

        $canciones = $query->get();

        $cancionesConPermisos = $canciones->map(function ($cancion) use ($usuarioAutenticado) {
            if ($usuarioAutenticado && method_exists($usuarioAutenticado, 'can')) {
                $cancion->can = [
                    'edit'   => $usuarioAutenticado->can('update', $cancion),
                    'delete' => $usuarioAutenticado->can('delete', $cancion),
                ];
            } else {
                $cancion->can = [
                    'edit'   => false,
                    'delete' => false,
                ];
            }
            return $cancion;
        });

        return Inertia::render('canciones/Canciones', [
            'canciones' => $cancionesConPermisos,
        ]);
    }

    public function create()
    {
        $licencias = Licencia::all();
        $generos = Genero::all()->pluck('nombre');;
        return Inertia::render('canciones/Create', [
            'generos' => $generos,
            'licencias' => $licencias,
        ]);
    }

    public function store(Request $request)
        {
            $rules = [
                'titulo' => 'required|string|max:255',
                'genero' => 'nullable|array',
                'genero.*' => 'exists:generos,nombre',
                'publico' => 'required|boolean',
                'archivo' => 'required|file|mimes:mp3,wav|max:102400',
                'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
                'licencia_id' => 'required|integer|exists:licencias,id',
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
                'remix' => 'required|boolean',
                'cancion_original_id' => 'nullable|integer|exists:canciones,id',
            ];
            $validated = $request->validate($rules);

            if ($validated['remix'] && !is_null($validated['cancion_original_id'])) {
                $existe = Cancion::join('licencias', 'canciones.licencia_id', '=', 'licencias.id')
                    ->where('canciones.id', $validated['cancion_original_id'])
                    ->where('licencias.id', 2)
                    ->exists();

                if (! $existe) {
                    return redirect()->back()
                        ->withErrors(['cancion_original_id' =>
                            'La obra original no existe o no tiene licencia CC BY 4.0.'])
                        ->withInput();
                }
            }

            $cancion = new Cancion();
            $cancion->titulo = $validated['titulo'];
            $cancion->publico = $validated['publico'];
            $cancion->licencia_id = $validated['licencia_id'];
            $cancion->remix = $validated['remix'];
            $cancion->cancion_original_id = $validated['cancion_original_id'] ?? null;

            if ($request->hasFile('archivo') && $request->file('archivo')->isValid()) {
                $archivoAudio = $request->file('archivo');
                $extension = $archivoAudio->getClientOriginalExtension();
                $nombre = Str::uuid() . "_song.{$extension}";

                try {
                    $getID3 = new getID3;
                    $infoAudio = $getID3->analyze($archivoAudio->getRealPath());
                    $cancion->duracion = isset($infoAudio['playtime_seconds'])
                        ? floor($infoAudio['playtime_seconds'])
                        : 0;
                } catch (\Exception $e) {
                    $cancion->duracion = 0;
                }

                try {
                    $path = Storage::disk('s3')
                        ->putFileAs('canciones', $archivoAudio, $nombre, 'public');
                    if (! $path) {
                        throw new \Exception('putFileAs devolvió false');
                    }
                    $cancion->archivo_url = Storage::disk('s3')->url($path);
                } catch (\Exception $e) {
                    Log::error('Error subiendo audio a S3', [
                        'error' => $e->getMessage(),
                        'bucket' => config('filesystems.disks.s3.bucket'),
                        'region' => config('filesystems.disks.s3.region'),
                    ]);
                    return redirect()->back()
                        ->withErrors(['archivo' => 'No se pudo subir el audio al bucket S3.'])
                        ->withInput();
                }
            } else {
                return redirect()->back()
                    ->withErrors(['archivo' => 'Archivo de audio inválido o no presente.'])
                    ->withInput();
            }

            if ($request->hasFile('foto') && $request->file('foto')->isValid()) {
                $archivoFoto = $request->file('foto');
                $extFoto = $archivoFoto->getClientOriginalExtension();
                $nombreFoto = Str::uuid() . "_pic.{$extFoto}";
                try {
                    $pathFoto = Storage::disk('s3')
                        ->putFileAs('imagenes', $archivoFoto, $nombreFoto, 'public');
                    $cancion->foto_url = $pathFoto
                        ? Storage::disk('s3')->url($pathFoto)
                        : null;
                } catch (\Exception $e) {
                    Log::error('Error subiendo imagen a S3', [
                        'error' => $e->getMessage(),
                        'bucket' => config('filesystems.disks.s3.bucket'),
                        'region' => config('filesystems.disks.s3.region'),
                    ]);
                    $cancion->foto_url = null;
                }
            }

            $cancion->save();

            if (!empty($validated['genero'])) {
                $ids = Genero::whereIn('nombre', $validated['genero'])->pluck('id');
                $cancion->generos()->attach($ids);
            }

            $idCreador = Auth::id();
            $colaboradores = $validated['userIds'] ?? [];
            $usuariosAsociar = [];

            if ($idCreador) {
                $usuariosAsociar[$idCreador] = ['propietario' => true];
            }
            foreach (array_unique($colaboradores) as $uid) {
                if ((int) $uid !== $idCreador) {
                    $usuariosAsociar[(int) $uid] = ['propietario' => false];
                }
            }
            if (!empty($usuariosAsociar) && method_exists($cancion, 'usuarios')) {
                $cancion->usuarios()->attach($usuariosAsociar);
            }

            $creador = Auth::user();
            $seguidores = $creador->seguidores;

            if ($cancion->publico) {
                foreach ($seguidores as $seguidor) {
                    Notificacion::create([
                        'user_id' => $seguidor->id,
                        'titulo' => 'Nuevo lanzamiento de ' . $creador->name,
                        'mensaje' => $creador->name . ' ha subido una nueva canción: ' . $cancion->titulo,
                    ]);
                }
            }

            return redirect()->route('profile.show', $creador->id);
        }


        public function show($id)
{
    try {
        $cancion = Cancion::with([
            'usuarios' => function ($query) {
                $query->withPivot('propietario');
            },
            'licencia',
            'generos',
            'cancionOriginal.usuarios' => function ($query) {
                $query->withPivot('propietario');
            }
        ])->findOrFail($id);

        // Mapear usuarios de la canción actual
        $cancion->usuarios_mapeados = $cancion->usuarios->map(function($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'es_propietario' => (bool) $u->pivot->propietario
            ];
        })->all();
        unset($cancion->usuarios);

        // Mapear géneros
        $cancion->generos_mapeados = $cancion->generos->map(function($g) {
            return $g->nombre;
        })->implode(', ');
        unset($cancion->generos);

        // Si hay una canción original, también mapeamos sus usuarios
        if ($cancion->cancionOriginal) {
            $cancion->cancionOriginal->usuarios_mapeados = $cancion->cancionOriginal->usuarios->map(function($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'es_propietario' => (bool) $u->pivot->propietario
                ];
            })->all();
            unset($cancion->cancionOriginal->usuarios);
        }

        return Inertia::render('canciones/Show', [
            'cancion' => $cancion
        ]);
    } catch (ModelNotFoundException $e) {
        return redirect()->route('welcome')->with('error', 'Canción no encontrada.');
    }
}

    public function edit($id)
    {
        try {
            $cancion = Cancion::with(['usuarios' => function ($query) {
                $query->withPivot('propietario');
            }])->findOrFail($id);
            $generosSeleccionados = $cancion->generos->pluck('nombre')->all();
            $this->authorize('update', $cancion);

             $usuariosMapeados = $cancion->usuarios->map(function ($usuario) {
                 return [
                     'id' => $usuario->id,
                     'name' => $usuario->name,
                     'email' => $usuario->email,
                     'es_propietario' => (bool) $usuario->pivot->propietario,
                 ];
             })->all();

             $cancionData = $cancion->toArray();
             unset($cancionData['usuarios']);
             $cancionData['usuarios'] = $usuariosMapeados;

            $generos = Genero::all()->pluck('nombre');

            return Inertia::render('canciones/Edit', [
                'cancion' => $cancionData,
                'generos' => $generos,
                'success' => session('success'),
                'generosSeleccionados' => $generosSeleccionados,
                'error' => session('error')
            ]);
        } catch (ModelNotFoundException $e) {
            return redirect()->route('canciones.index')->with('error', 'Canción no encontrada.');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $cancion = Cancion::with(['usuarios' => fn($q) => $q->withPivot('propietario')])
                               ->findOrFail($id);

            $this->authorize('update', $cancion);

            $validated = $request->validate([
                'titulo' => 'required|string|max:255',
                'genero' => 'nullable|array',
                'genero.*' => 'string|max:255|exists:generos,nombre',
                'publico' => 'required|boolean',
                'archivo_nuevo' => 'nullable|file|mimes:mp3,wav|max:102400',
                'foto_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
                'eliminar_foto' => 'nullable|boolean',
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
            ]);

            $cancion->titulo = $validated['titulo'];
            $cancion->publico = $validated['publico'];

            if ($request->hasFile('archivo_nuevo')) {
                $nuevoArchivoAudio = $request->file('archivo_nuevo');
                $urlAudioAntiguo = $cancion->archivo_url;
                $rutaAudioAntiguo = $this->getRelativePath($urlAudioAntiguo);

                if ($rutaAudioAntiguo && Storage::disk('s3')->exists($rutaAudioAntiguo)) {
                    Storage::disk('s3')->delete($rutaAudioAntiguo);
                }

                $extensionAudio = $nuevoArchivoAudio->getClientOriginalExtension();
                $nombreAudio = Str::uuid() . "_song.{$extensionAudio}";

                try {
                    $getID3 = new getID3;
                    $infoAudio = $getID3->analyze($nuevoArchivoAudio->getRealPath());
                    $cancion->duracion = isset($infoAudio['playtime_seconds']) ? floor($infoAudio['playtime_seconds']) : ($cancion->duracion ?? 0);
                } catch (\Exception $e) {
                    $cancion->duracion = $cancion->duracion ?? 0;
                }

                try {
                    $pathAudio = Storage::disk('s3')->putFileAs('canciones', $nuevoArchivoAudio, $nombreAudio, 'public');
                    if ($pathAudio) {
                        $cancion->archivo_url = Storage::disk('s3')->url($pathAudio);
                    } else {
                        throw new \Exception('putFileAs devolvió false');
                    }
                } catch (\Exception $e) {
                    Log::error('Error actualizando audio en S3', [
                        'error' => $e->getMessage(),
                        'bucket' => config('filesystems.disks.s3.bucket'),
                        'region' => config('filesystems.disks.s3.region'),
                    ]);
                    return back()->withErrors(['archivo_nuevo' => 'No se pudo guardar el nuevo archivo de audio en S3.'])->withInput();
                }
            }

            $eliminarFoto = $request->boolean('eliminar_foto');
            $urlFotoAntigua = $cancion->foto_url;
            $rutaFotoAntigua = $this->getRelativePath($urlFotoAntigua);

            if ($request->hasFile('foto_nueva')) {
                $nuevoArchivoFoto = $request->file('foto_nueva');
                if ($rutaFotoAntigua && Storage::disk('s3')->exists($rutaFotoAntigua)) {
                    Storage::disk('s3')->delete($rutaFotoAntigua);
                }

                $extensionFoto = $nuevoArchivoFoto->getClientOriginalExtension();
                $nombreFoto = Str::uuid() . "_pic.{$extensionFoto}";
                try {
                    $pathFoto = Storage::disk('s3')->putFileAs('imagenes', $nuevoArchivoFoto, $nombreFoto, 'public');
                    if ($pathFoto) {
                        $cancion->foto_url = Storage::disk('s3')->url($pathFoto);
                    } else {
                        throw new \Exception('putFileAs devolvió false');
                    }
                } catch (\Exception $e) {
                    Log::error('Error actualizando imagen en S3', [
                        'error' => $e->getMessage(),
                        'bucket' => config('filesystems.disks.s3.bucket'),
                        'region' => config('filesystems.disks.s3.region'),
                    ]);
                    return back()->withErrors(['foto_nueva' => 'No se pudo guardar la nueva foto en S3.'])->withInput();
                }

            } elseif ($eliminarFoto) {
                if ($rutaFotoAntigua && Storage::disk('s3')->exists($rutaFotoAntigua)) {
                    Storage::disk('s3')->delete($rutaFotoAntigua);
                }
                $cancion->foto_url = null;
            }

            $cancion->save();

            $generoNombres = $validated['genero'] ?? [];
            $generoIds = Genero::whereIn('nombre', $generoNombres)->pluck('id')->toArray();
            $cancion->generos()->sync($generoIds);

            if (method_exists($cancion, 'usuarios')) {
                $propietario = $cancion->usuarios()->wherePivot('propietario', true)->first();
                $propietarioId = $propietario ? $propietario->id : null;

                if (!$propietarioId) {
                    return Redirect::route('canciones.edit', $cancion->id)->with('error', 'Error: No se encontró propietario para esta canción.');
                }

                $idsUsuariosSincronizarInput = $request->input('userIds', []);
                if (!is_array($idsUsuariosSincronizarInput)) {
                    $idsUsuariosSincronizarInput = [];
                }
                $idsUsuariosSincronizar = array_map('intval', $idsUsuariosSincronizarInput);

                if (!in_array($propietarioId, $idsUsuariosSincronizar)) {
                    $idsUsuariosSincronizar[] = $propietarioId;
                }

                $idsUsuariosUnicos = array_unique($idsUsuariosSincronizar);

                $usuariosParaSincronizar = [];
                foreach ($idsUsuariosUnicos as $userId) {
                    $esPropietario = ($userId === $propietarioId);
                    $usuariosParaSincronizar[$userId] = ['propietario' => $esPropietario];
                }

                $cancion->usuarios()->sync($usuariosParaSincronizar);
            }

            return Redirect::route('canciones.show', $cancion->id )->with('success', 'Canción actualizada exitosamente.');

        } catch (ModelNotFoundException $e) {
            return redirect()->route('canciones.show', $cancion->id)->with('error', 'Canción no encontrada.');
        } catch (\Exception $e) {
            Log::error("Error updating cancion ID {$id}: " . $e->getMessage() . " Stack trace: " . $e->getTraceAsString());
             return Redirect::route('canciones.edit', $id)->with('error', 'Ocurrió un error al actualizar la canción: ' . $e->getMessage())->withInput();
        }
    }

    public function destroy($id)
    {
        $usuario = Auth::user();

        $cancion = Cancion::findOrFail($id);
        $this->authorize('delete', $cancion);

        if (method_exists($cancion, 'usuarios')) {
            $cancion->usuarios()->detach();
        }

        $rutaAudio = $this->getRelativePath($cancion->archivo_url);
        if ($rutaAudio && Storage::disk('s3')->exists($rutaAudio)) {
            Storage::disk('s3')->delete($rutaAudio);
        }

        $rutaFoto = $this->getRelativePath($cancion->foto_url);
        if ($rutaFoto && Storage::disk('s3')->exists($rutaFoto)) {
            Storage::disk('s3')->delete($rutaFoto);
        }

        $cancion->delete();

        return redirect()->route('profile.show', $usuario->id)->with('success', 'Canción eliminada exitosamente.');
    }

    public function buscarUsuarios(Request $request)
    {
        $termino = $request->query('q', '');
        $limite = 10;
        $query = User::query();

        $usuarioActualId = Auth::id();
        if ($usuarioActualId) {
            $query->where('id', '!=', $usuarioActualId);
        }

        if (!empty($termino)) {
            $query->where(function ($q) use ($termino) {
                $q->where('name', 'like', '%' . $termino . '%')
                  ->orWhere('email', 'like', '%' . $termino . '%');
            });
        } else {
            $query->orderBy('name', 'asc');
        }

        $usuarios = $query->select('id', 'name', 'email')
                          ->take($limite)
                          ->get();

        return response()->json($usuarios);
    }

    private function getRelativePath(?string $url): ?string
    {
        if (!$url) return null;
        try {
            $path = parse_url($url, PHP_URL_PATH) ?: '';
            $bucket = config('filesystems.disks.s3.bucket');
            $s3BasePath = '/' . $bucket . '/';

            if (Str::startsWith($path, $s3BasePath)) {
                $relativePath = Str::after($path, $s3BasePath);
                return ltrim($relativePath, '/');
            }
            $path = ltrim($path, '/');
            if (Str::startsWith($path, 'canciones/') || Str::startsWith($path, 'imagenes/')) {
                return $path;
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Error parsing S3 URL path: ' . $e->getMessage(), ['url' => $url]);
            return null;
        }
    }

    public function cancionloopz($idCancion)
    {
        $cancion = Cancion::findOrFail($idCancion);
        $user = Auth::user();

        $playlistloopz = $user->perteneceContenedores()
            ->where('tipo', 'loopz')
            ->pluck('id');

        foreach ($playlistloopz as $contenedorId) {
            if ($cancion->contenedores()
                        ->wherePivot('contenedor_id', $contenedorId)
                        ->exists()
            ) {
                $cancion->contenedores()->detach($contenedorId);
            } else {
                $cancion->contenedores()->attach($contenedorId);
            }
        }
    }
    public function buscarCancionesOriginales(Request $request)
    {
        $termino = $request->query('q', '');
        $limite = 10;
        $query = Cancion::query();

        $query->where('canciones.licencia_id', 2);

        if (!empty($termino)) {
            $query->where('canciones.titulo', 'LIKE', '%' . $termino . '%');
        }

        $query->select('canciones.id', 'canciones.titulo', 'canciones.foto_url');


        $canciones = $query->take($limite)
                           ->get();

        return response()->json($canciones);
    }


    public function incrementarVisualizacion(Request $request, $id)
    {
        DB::table('canciones')
            ->where('id', $id)
            ->increment('visualizaciones');

        $visualizaciones = DB::table('canciones')->where('id', $id)->value('visualizaciones');

        $response = response()->json([
            'message' => 'Visualización incrementada con éxito',
            'visualizaciones' => $visualizaciones,
            'cancion_id' => $id,
        ]);

        if ($visualizaciones === 100) {
            $cancion = Cancion::with('usuarios')->find($id);

            if ($cancion && $cancion->usuarios->isNotEmpty()) {
                foreach ($cancion->usuarios as $usuario) {
                    Notificacion::create([
                        'titulo' => '¡Tu canción llegó a 100 visualizaciones!',
                        'mensaje' => "La canción '{$cancion->titulo}' ha alcanzado 100 reproducciones.",
                        'leido' => false,
                        'user_id' => $usuario->id,
                    ]);
                }
            }
        }

        return $response;
    }

}
