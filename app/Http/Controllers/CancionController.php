<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Genero;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use getID3;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
        $generos = Genero::all()->pluck('nombre');;
        return Inertia::render('canciones/Create', [
            'generos' => $generos,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|array',
            'genero.*' => 'exists:generos,nombre',
            'publico' => 'required|boolean',
            'archivo' => 'required|file|mimes:mp3,wav|max:10024',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'licencia' => 'nullable|string|max:255',
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $cancion = new Cancion();
        $cancion->titulo = $validated['titulo'];
        $cancion->publico = $validated['publico'];
        $cancion->licencia = $validated['licencia'] ?? '';

        if ($request->hasFile('archivo')) {
            $archivoAudio = $request->file('archivo');
            $extensionAudio = $archivoAudio->getClientOriginalExtension();
            $nombreAudio = Str::uuid() . "_song.{$extensionAudio}";

            try {
                $getID3 = new getID3;
                $infoAudio = $getID3->analyze($archivoAudio->getRealPath());
                $cancion->duracion = isset($infoAudio['playtime_seconds'])
                    ? round($infoAudio['playtime_seconds'])
                    : 0;
            } catch (\Exception $e) {
                $cancion->duracion = 0;
            }

            $pathAudio = $archivoAudio->storeAs('canciones', $nombreAudio, 'public');
            $cancion->archivo_url = $pathAudio
                ? Storage::disk('public')->url($pathAudio)
                : null;
        }

        if ($request->hasFile('foto')) {
            $archivoFoto = $request->file('foto');
            $extensionFoto = $archivoFoto->getClientOriginalExtension();
            $nombreFoto = Str::uuid() . "_pic.{$extensionFoto}";
            $pathFoto = $archivoFoto->storeAs('imagenes', $nombreFoto, 'public');
            $cancion->foto_url = $pathFoto
                ? Storage::disk('public')->url($pathFoto)
                : null;
        }

        $cancion->save();

        if (!empty($validated['genero'])) {
            $idsGeneros = Genero::whereIn('nombre', $validated['genero'])->pluck('id');
            $cancion->generos()->attach($idsGeneros);
        }

        $idCreador = Auth::id();
        $idsColaboradores = $validated['userIds'] ?? [];
        $usuariosParaAsociar = [];

        if ($idCreador) {
            $usuariosParaAsociar[$idCreador] = ['propietario' => true];
        }

        foreach (array_unique($idsColaboradores) as $colaboradorId) {
            if ((int) $colaboradorId !== $idCreador) {
                $usuariosParaAsociar[(int) $colaboradorId] = ['propietario' => false];
            }
        }

        if (!empty($usuariosParaAsociar) && method_exists($cancion, 'usuarios')) {
            $cancion->usuarios()->attach($usuariosParaAsociar);
        }

        return redirect()->route('canciones.index')
                         ->with('success', 'Canción creada exitosamente.');
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

            // --- Validation ---
            // Adjusted validation for 'genero' to be an array of strings
            $validated = $request->validate([
                'titulo' => 'required|string|max:255',
                // Validate 'genero' as a nullable array
                'genero' => 'nullable|array',
                // Validate each item in the 'genero' array: string, max length, and must exist in the 'nombre' column of the 'generos' table
                'genero.*' => 'string|max:255|exists:generos,nombre',
                'publico' => 'required|boolean',
                'archivo_nuevo' => 'nullable|file|mimes:mp3,wav|max:10024', // Max 10MB
                'foto_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120', // Max 5MB
                'eliminar_foto' => 'nullable|boolean',
                'licencia' => 'nullable|string|max:255',
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
            ]);
            // --- End Validation ---


            // --- Update basic song attributes ---
            $cancion->titulo = $validated['titulo'];
            // Removed the line that assigned the genre array to a single column
            // $cancion->genero = $validated['genero'] ?? null;
            $cancion->licencia = $validated['licencia'] ?? null;
            $cancion->publico = $validated['publico'];
            // --- End Update basic song attributes ---


            // --- Handle File Uploads (Audio and Photo) ---
            // Handle Audio File
            if ($request->hasFile('archivo_nuevo')) {
                $nuevoArchivoAudio = $request->file('archivo_nuevo');
                $urlAudioAntiguo = $cancion->archivo_url;
                $rutaAudioAntiguo = $this->getRelativePath($urlAudioAntiguo); // Assuming getRelativePath method exists

                // Delete old audio file if it exists
                if ($rutaAudioAntiguo && Storage::disk('public')->exists($rutaAudioAntiguo)) {
                    Storage::disk('public')->delete($rutaAudioAntiguo);
                }

                $extensionAudio = $nuevoArchivoAudio->getClientOriginalExtension();
                $nombreAudio = Str::uuid() . "_song.{$extensionAudio}";

                // Try to get duration using getID3
                try {
                    $getID3 = new getID3;
                    $infoAudio = $getID3->analyze($nuevoArchivoAudio->getRealPath());
                    $cancion->duracion = isset($infoAudio['playtime_seconds']) ? round($infoAudio['playtime_seconds']) : ($cancion->duracion ?? 0);
                } catch (\Exception $e) {
                    // Log the getID3 error if necessary
                    // \Log::error("getID3 error for song ID {$id}: " . $e->getMessage());
                    $cancion->duracion = $cancion->duracion ?? 0; // Keep old duration or default to 0
                }

                // Store the new audio file
                $pathAudio = $nuevoArchivoAudio->storeAs('canciones', $nombreAudio, 'public');
                if ($pathAudio) {
                    $cancion->archivo_url = Storage::disk('public')->url($pathAudio);
                     // You might also want to store the filename
                     $cancion->archivo_nombre = $nuevoArchivoAudio->getClientOriginalName();
                } else {
                    // If storage fails, return error and don't save the song yet
                    return back()->withErrors(['archivo_nuevo' => 'No se pudo guardar el nuevo archivo de audio.'])->withInput();
                }
            }
             // You might want logic here to handle deleting the audio if a new file is NOT uploaded but you want to remove the old one
             // (though the frontend doesn't currently send an explicit 'eliminar_audio' flag)


            // Handle Photo File
            $eliminarFoto = $request->boolean('eliminar_foto'); // Frontend sends this flag if photo should be removed
            $urlFotoAntigua = $cancion->foto_url;
            $rutaFotoAntigua = $this->getRelativePath($urlFotoAntigua); // Assuming getRelativePath method exists

            if ($request->hasFile('foto_nueva')) {
                $nuevoArchivoFoto = $request->file('foto_nueva');
                 // Delete old photo file if it exists
                if ($rutaFotoAntigua && Storage::disk('public')->exists($rutaFotoAntigua)) {
                    Storage::disk('public')->delete($rutaFotoAntigua);
                }

                $extensionFoto = $nuevoArchivoFoto->getClientOriginalExtension();
                $nombreFoto = Str::uuid() . "_pic.{$extensionFoto}";
                $pathFoto = $nuevoArchivoFoto->storeAs('imagenes', $nombreFoto, 'public');
                if ($pathFoto) {
                    $cancion->foto_url = Storage::disk('public')->url($pathFoto);
                } else {
                     // If storage fails, return error and don't save the song yet
                     return back()->withErrors(['foto_nueva' => 'No se pudo guardar la nueva foto.'])->withInput();
                }

            } elseif ($eliminarFoto) {
                 // If 'eliminar_foto' flag is true and no new photo was uploaded
                if ($rutaFotoAntigua && Storage::disk('public')->exists($rutaFotoAntigua)) {
                    Storage::disk('public')->delete($rutaFotoAntigua);
                }
                $cancion->foto_url = null; // Set foto_url to null
            }
            // --- End Handle File Uploads ---


            // Save the Cancion model *before* syncing relationships
            // This is important if the relationships rely on the song having an ID
            $cancion->save();


            // --- Sync Genres ---
            // Get the array of genre names from validated data (it's already filtered/validated by `exists:generos,nombre`)
            $generoNombres = $validated['genero'] ?? [];

            // Find the IDs of the Genero models based on the names
            // Ensure we only get IDs for names that exist in the database
            $generoIds = Genero::whereIn('nombre', $generoNombres)->pluck('id')->toArray();

            // Sync the genres relationship using the found IDs
            // `sync` will detach any existing genres not in $generoIds and attach any in $generoIds that are not already attached
            $cancion->generos()->sync($generoIds);
            // --- End Sync Genres ---


            // --- Sync Collaborators (Users) ---
            // Ensure the users relationship exists on the Cancion model
            if (method_exists($cancion, 'usuarios')) {

                // Find the current owner
                $propietario = $cancion->usuarios()->wherePivot('propietario', true)->first();
                $propietarioId = $propietario ? $propietario->id : null;

                if (!$propietarioId) {
                    // This should ideally not happen if a song always has an owner,
                    // but it's good defensive programming.
                    // Note: Redirecting back to edit might lose form data here.
                    // Consider handling this edge case during song creation or in a different way.
                    // For now, keep the redirect but be aware.
                    return Redirect::route('canciones.edit', $cancion->id)->with('error', 'Error: No se encontró propietario para esta canción.');
                }

                // Get the user IDs from the request input
                $idsUsuariosSincronizarInput = $request->input('userIds', []);
                // Ensure it's an array just in case validation somehow failed or input was weird
                if (!is_array($idsUsuariosSincronizarInput)) {
                    $idsUsuariosSincronizarInput = [];
                }
                 // Map to integers to be safe
                $idsUsuariosSincronizar = array_map('intval', $idsUsuariosSincronizarInput);


                // Ensure the original owner is always included in the list to sync
                // unless they are explicitly being removed AND there are other users
                 // The frontend logic should prevent removing the last user if it's the owner
                 // But this backend check is a safety net.
                 // The frontend allows removing non-owner users.
                 // If the input user list does *not* contain the owner, add them back.
                 // This prevents accidentally removing the owner via the collaborator list.
                if (!in_array($propietarioId, $idsUsuariosSincronizar)) {
                     // If the owner is NOT in the list from the frontend, add them back
                     $idsUsuariosSincronizar[] = $propietarioId;
                }

                // Ensure uniqueness
                $idsUsuariosUnicos = array_unique($idsUsuariosSincronizar);

                // Prepare the data structure for sync (ID => pivot data)
                $usuariosParaSincronizar = [];
                foreach ($idsUsuariosUnicos as $userId) {
                    // The owner is the one whose ID matches $propietarioId
                    $esPropietario = ($userId === $propietarioId);
                    $usuariosParaSincronizar[$userId] = ['propietario' => $esPropietario];
                }

                // Sync the users relationship
                // `sync` will detach users not in $usuariosParaSincronizar,
                // attach users in $usuariosParaSincronizar not currently attached,
                // and update pivot data for users already attached.
                $cancion->usuarios()->sync($usuariosParaSincronizar);
            }
            // --- End Sync Collaborators ---


            // Redirect on success
            // Redirecting to the index page is fine, or you could redirect to the show page:
            // return Redirect::route('canciones.show', $cancion->id)->with('success', 'Canción actualizada exitosamente.');
            return Redirect::route('canciones.index')->with('success', 'Canción actualizada exitosamente.');

        } catch (ModelNotFoundException $e) {
            // Redirect to index with error if song not found
            return redirect()->route('canciones.index')->with('error', 'Canción no encontrada.');
        } catch (\Exception $e) {
            // Catch any other exceptions during the update process
            // Log the error for debugging
            \Log::error("Error updating song ID {$id}: " . $e->getMessage() . " Stack trace: " . $e->getTraceAsString());

            // Redirect back to the edit page with an error message
            // Consider returning Inertia::render with errors and input if you want
            // the user to see the form again with pre-filled data and errors.
             return Redirect::route('canciones.edit', $id)->with('error', 'Ocurrió un error al actualizar la canción: ' . $e->getMessage())->withInput();
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

}
