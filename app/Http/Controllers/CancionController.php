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
        $usuario = Auth::user();

        $query = Cancion::with(['usuarios' => function ($query) {
            $query->withPivot('propietario');
        }])->latest();

        if ($usuario) {
            $query->whereHas('usuarios', function ($q) use ($usuario) {
                $q->where('user_id', $usuario->id);
            });
        } else {
            $query->whereRaw('1 = 0');
        }

        $canciones = $query->get();

        $cancionesConPermisos = $canciones->map(function ($cancion) use ($usuario) {
            if ($usuario && method_exists($usuario, 'can')) {
                $cancion->can = [
                    'edit'   => $usuario->can('update', $cancion),
                    'delete' => $usuario->can('delete', $cancion),
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

        $cancion->usuarios_mapeados = $cancion->usuarios->map(function($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'es_propietario' => (bool) $u->pivot->propietario
            ];
        })->all();
        unset($cancion->usuarios);

        $cancion->generos_mapeados = $cancion->generos->map(function($g) {
            return $g->nombre;
        })->implode(', ');
        unset($cancion->generos);

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
            'archivo' => 'nullable|file|mimes:mp3,wav|max:102400',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'eliminar_foto' => 'nullable|boolean',
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $cancion->titulo = $validated['titulo'];
        $cancion->publico = $validated['publico'];

        if ($request->hasFile('archivo')) {
            $nuevoArchivoAudio = $request->file('archivo');
            $rutaAnterior = $this->getRelativePath($cancion->archivo_url);
            if ($rutaAnterior && Storage::disk('s3')->exists($rutaAnterior)) {
                Storage::disk('s3')->delete($rutaAnterior);
            }
            $nombre = Str::uuid() . '_song.' . $nuevoArchivoAudio->getClientOriginalExtension();
            $getID3 = new getID3;
            try {
                $info = $getID3->analyze($nuevoArchivoAudio->getRealPath());
                $cancion->duracion = isset($info['playtime_seconds']) ? floor($info['playtime_seconds']) : $cancion->duracion;
            } catch (\Exception $e) {
                $cancion->duracion = $cancion->duracion ?? 0;
            }
            $path = Storage::disk('s3')->putFileAs('canciones', $nuevoArchivoAudio, $nombre, ['visibility' => 'public']);
            if (!$path) {
                return back()->withErrors(['archivo' => 'No se pudo guardar el nuevo archivo de audio.'])->withInput();
            }
            $cancion->archivo_url = Storage::disk('s3')->url($path);
        }

        $eliminarFoto = $request->boolean('eliminar_foto');
        if ($request->hasFile('foto')) {
            $nuevaFoto = $request->file('foto');
            $rutaAnterior = $this->getRelativePath($cancion->foto_url);
            if ($rutaAnterior && Storage::disk('s3')->exists($rutaAnterior)) {
                Storage::disk('s3')->delete($rutaAnterior);
            }
            $nombre = Str::uuid() . '_pic.' . $nuevaFoto->getClientOriginalExtension();
            $path = Storage::disk('s3')->putFileAs('imagenes', $nuevaFoto, $nombre, ['visibility' => 'public']);
            if (!$path) {
                return back()->withErrors(['foto' => 'No se pudo guardar la nueva imagen.'])->withInput();
            }
            $cancion->foto_url = Storage::disk('s3')->url($path);
        } elseif ($eliminarFoto) {
            $ruta = $this->getRelativePath($cancion->foto_url);
            if ($ruta && Storage::disk('s3')->exists($ruta)) {
                Storage::disk('s3')->delete($ruta);
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
                return Redirect::route('canciones.edit', $cancion->id)->with('error', 'No se encontró propietario.');
            }

            $ids = array_map('intval', $request->input('userIds', []));
            if (!in_array($propietarioId, $ids)) {
                $ids[] = $propietarioId;
            }

            $usuariosParaSincronizar = [];
            foreach (array_unique($ids) as $uid) {
                $usuariosParaSincronizar[$uid] = ['propietario' => $uid === $propietarioId];
            }

            $cancion->usuarios()->sync($usuariosParaSincronizar);
        }

        return Redirect::route('canciones.show', $cancion->id)->with('success', 'Canción actualizada exitosamente.');
    } catch (ModelNotFoundException $e) {
        return redirect()->route('canciones.index')->with('error', 'Canción no encontrada.');
    } catch (\Exception $e) {
        Log::error("Error al actualizar canción: " . $e->getMessage());
        return Redirect::route('canciones.edit', $id)->with('error', 'Error al actualizar canción.')->withInput();
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
