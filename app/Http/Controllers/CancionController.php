<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use getID3;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;

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
         return Inertia::render('canciones/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'publico' => 'required|boolean',
            'archivo' => 'required|file|mimes:mp3,wav|max:10024',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'licencia' => 'nullable|string|max:255',
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $cancion = new Cancion();
        $cancion->titulo = $request->input('titulo');
        $cancion->genero = $request->input('genero');
        $cancion->publico = $request->input('publico');
        $cancion->licencia = $request->input('licencia');

        if ($request->hasFile('archivo')) {
            $archivoAudio = $request->file('archivo');
            $extensionAudio = $archivoAudio->getClientOriginalExtension();
            $nombreAudio = Str::uuid() . "_song.{$extensionAudio}";

            try {
                $getID3 = new getID3;
                $infoAudio = $getID3->analyze($archivoAudio->getRealPath());
                $cancion->duracion = isset($infoAudio['playtime_seconds']) ? round($infoAudio['playtime_seconds']) : 0;
            } catch (\Exception $e) {
                $cancion->duracion = 0;
            }

            $pathAudio = $archivoAudio->storeAs('canciones', $nombreAudio, 'public');
            if ($pathAudio) {
                 $cancion->archivo_url = Storage::disk('public')->url($pathAudio);
            } else {
                 return back()->withErrors(['archivo' => 'No se pudo guardar el archivo de audio.'])->withInput();
            }
        } else {
            return back()->withErrors(['archivo' => 'El archivo de audio es obligatorio.'])->withInput();
        }

        if ($request->hasFile('foto')) {
            $archivoFoto = $request->file('foto');
            $extensionFoto = $archivoFoto->getClientOriginalExtension();
            $nombreFoto = Str::uuid() . "_pic.{$extensionFoto}";
            $pathFoto = $archivoFoto->storeAs('imagenes', $nombreFoto, 'public');
             if ($pathFoto) {
                 $cancion->foto_url = Storage::disk('public')->url($pathFoto);
             }
        }

        $cancion->save();

        $idCreador = Auth::id();
        $idsColaboradores = $request->input('userIds', []);
        $usuariosParaAsociar = [];

        if ($idCreador) {
            $usuariosParaAsociar[$idCreador] = ['propietario' => true];
        }

        foreach (array_unique($idsColaboradores) as $colaboradorId) {
            $colaboradorIdInt = (int)$colaboradorId;
            if ($colaboradorIdInt !== $idCreador) {
                $usuariosParaAsociar[$colaboradorIdInt] = ['propietario' => false];
            }
        }

        if (!empty($usuariosParaAsociar) && method_exists($cancion, 'usuarios')) {
            $cancion->usuarios()->attach($usuariosParaAsociar);
        }

        return redirect()->route('canciones.index')->with('success', 'Canción creada exitosamente.');
    }

    public function show($id)
    {
        try {
            $cancion = Cancion::with(['usuarios' => function ($query) {
                $query->withPivot('propietario');
            }])->findOrFail($id);

             $cancion->usuarios_mapeados = $cancion->usuarios->map(function($u) {
                 return [
                     'id' => $u->id,
                     'name' => $u->name,
                     'email' => $u->email,
                     'es_propietario' => (bool) $u->pivot->propietario
                 ];
             })->all();
             unset($cancion->usuarios);

            return Inertia::render('canciones/Show', [
                'cancion' => $cancion
            ]);
        } catch (ModelNotFoundException $e) {
             return redirect()->route('canciones.index')->with('error', 'Canción no encontrada.');
        }
    }

    public function edit($id)
    {
        try {
            $cancion = Cancion::with(['usuarios' => function ($query) {
                $query->withPivot('propietario');
            }])->findOrFail($id);

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

            return Inertia::render('canciones/Edit', [
                'cancion' => $cancionData,
                'success' => session('success'),
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
                 'genero' => 'nullable|string|max:255',
                 'publico' => 'required|boolean',
                 'archivo_nuevo' => 'nullable|file|mimes:mp3,wav|max:10024',
                 'foto_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
                 'eliminar_foto' => 'nullable|boolean',
                 'licencia' => 'nullable|string|max:255',
                 'userIds' => 'nullable|array',
                 'userIds.*' => 'integer|exists:users,id',
             ]);

             $cancion->titulo = $validated['titulo'];
             $cancion->genero = $validated['genero'] ?? null;
             $cancion->licencia = $validated['licencia'] ?? null;
             $cancion->publico = $validated['publico'];

             if ($request->hasFile('archivo_nuevo')) {
                 $nuevoArchivoAudio = $request->file('archivo_nuevo');
                 $urlAudioAntiguo = $cancion->archivo_url;
                 $rutaAudioAntiguo = $this->getRelativePath($urlAudioAntiguo);

                 if ($rutaAudioAntiguo && Storage::disk('public')->exists($rutaAudioAntiguo)) {
                     Storage::disk('public')->delete($rutaAudioAntiguo);
                 }

                 $extensionAudio = $nuevoArchivoAudio->getClientOriginalExtension();
                 $nombreAudio = Str::uuid() . "_song.{$extensionAudio}";

                 try {
                     $getID3 = new getID3;
                     $infoAudio = $getID3->analyze($nuevoArchivoAudio->getRealPath());
                     $cancion->duracion = isset($infoAudio['playtime_seconds']) ? round($infoAudio['playtime_seconds']) : ($cancion->duracion ?? 0);
                 } catch (\Exception $e) {
                     $cancion->duracion = $cancion->duracion ?? 0;
                 }

                 $pathAudio = $nuevoArchivoAudio->storeAs('canciones', $nombreAudio, 'public');
                  if ($pathAudio) {
                      $cancion->archivo_url = Storage::disk('public')->url($pathAudio);
                  } else {
                      return back()->withErrors(['archivo_nuevo' => 'No se pudo guardar el nuevo archivo de audio.'])->withInput();
                  }
             }

             $eliminarFoto = $request->boolean('eliminar_foto');
             $urlFotoAntigua = $cancion->foto_url;
             $rutaFotoAntigua = $this->getRelativePath($urlFotoAntigua);

             if ($request->hasFile('foto_nueva')) {
                 $nuevoArchivoFoto = $request->file('foto_nueva');
                 if ($rutaFotoAntigua && Storage::disk('public')->exists($rutaFotoAntigua)) {
                     Storage::disk('public')->delete($rutaFotoAntigua);
                 }

                 $extensionFoto = $nuevoArchivoFoto->getClientOriginalExtension();
                 $nombreFoto = Str::uuid() . "_pic.{$extensionFoto}";
                 $pathFoto = $nuevoArchivoFoto->storeAs('imagenes', $nombreFoto, 'public');
                  if ($pathFoto) {
                     $cancion->foto_url = Storage::disk('public')->url($pathFoto);
                  }

             } elseif ($eliminarFoto) {
                 if ($rutaFotoAntigua && Storage::disk('public')->exists($rutaFotoAntigua)) {
                     Storage::disk('public')->delete($rutaFotoAntigua);
                 }
                 $cancion->foto_url = null;
             }

             $cancion->save();

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

             return Redirect::route('canciones.index')->with('success', 'Canción actualizada exitosamente.');

         } catch (ModelNotFoundException $e) {
             return redirect()->route('canciones.index')->with('error', 'Canción no encontrada.');
         } catch (\Exception $e) {
             return Redirect::route('canciones.edit', $id)->with('error', 'Ocurrió un error al actualizar la canción: ' . $e->getMessage());
         }
     }

    public function destroy($id)
    {
        try {
            $cancion = Cancion::findOrFail($id);
            $this->authorize('delete', $cancion);

            if (method_exists($cancion, 'usuarios')) {
                $cancion->usuarios()->detach();
            }

            $rutaAudio = $this->getRelativePath($cancion->archivo_url);
            if ($rutaAudio && Storage::disk('public')->exists($rutaAudio)) {
                Storage::disk('public')->delete($rutaAudio);
            }

            $rutaFoto = $this->getRelativePath($cancion->foto_url);
            if ($rutaFoto && Storage::disk('public')->exists($rutaFoto)) {
                Storage::disk('public')->delete($rutaFoto);
            }

            $cancion->delete();

            return redirect()->route('canciones.index')->with('success', 'Canción eliminada correctamente');
        } catch (ModelNotFoundException $e) {
            return redirect()->route('canciones.index')->with('error', 'Canción no encontrada.');
        } catch (\Exception $e) {
             return redirect()->route('canciones.index')->with('error', 'Ocurrió un error al eliminar la canción: ' . $e->getMessage());
         }
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
            $prefijoStorage = '/storage/';
            if (Str::startsWith($path, $prefijoStorage)) {
                $relativePath = Str::after($path, $prefijoStorage);
                return ltrim($relativePath, '/');
            }

             $path = ltrim($path, '/');
             if (Str::startsWith($path, 'canciones/') || Str::startsWith($path, 'imagenes/')) {
                 return $path;
             }

            return null;

        } catch (\Exception $e) {
            return null;
        }
    }

    public function toggleLoopz(Request $request, Cancion $cancion)
    {
        $user = Auth::user();

        if (!$user) {
            return Redirect::back()->with('error', 'Debes iniciar sesión.');
        }

        if (!method_exists($cancion, 'loopzUsuarios')) {
             Log::error("La relación 'loopzUsuarios' no existe en el modelo Cancion.");
             return Redirect::back()->with('error', 'Error interno al procesar la solicitud.');
        }

        $relation = $cancion->loopzUsuarios();
        $isLiked = $relation->where('user_id', $user->id)->exists();

        if ($isLiked) {
            $relation->detach($user->id);
            $mensaje = 'Canción quitada de LoopZ.';
        } else {
            $relation->attach($user->id);
            $mensaje = 'Canción añadida a LoopZ.';
        }

        return Redirect::back()->with('success', $mensaje);
    }

}
