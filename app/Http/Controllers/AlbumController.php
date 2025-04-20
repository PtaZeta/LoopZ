<?php
// app/Http/Controllers/AlbumController.php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAlbumRequest;
use App\Http\Requests\UpdateAlbumRequest;
use App\Models\Album;
use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class AlbumController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $albumesQuery = Album::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest();

        if ($user) {
             $albumesQuery->where('publico', true)
                         ->orWhereHas('usuarios', function ($query) use ($user) {
                             $query->where('users.id', $user->id);
                         });
        } else {
            $albumesQuery->where('publico', true);
        }

        $albumes = $albumesQuery->get();


        $albumesConPermisos = $albumes->map(function ($album) use ($user) {
            if ($user) {
                $album->can = [
                    'view'   => $user->can('view', $album),
                    'edit'   => $user->can('update', $album),
                    'delete' => $user->can('delete', $album),
                ];
            } else {
                 $album->can = [
                    'view'   => $album->publico,
                    'edit'   => false,
                    'delete' => false,
                 ];
            }
            // Ensure imagen_url is appended if needed (check Album model $appends)
            if ($album->imagen_url) {
                 $album->imagen_url = $album->imagen_url;
             }
            return $album;
        });
        return Inertia::render('albumes/Index', [
            'albumes' => $albumesConPermisos,
        ]);
    }

    public function create()
    {
        return Inertia::render('albumes/Create');
    }

    public function store(StoreAlbumRequest $request)
    {
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('album_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
             unset($datosValidados['imagen']);
        }

        $validatedUserIds = $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $album = Album::create($datosValidados);

        if (method_exists($album, 'usuarios')) {
            $userIdsToAttach = $validatedUserIds['userIds'] ?? [];
            $creatorId = Auth::id();
            if ($creatorId && !in_array($creatorId, $userIdsToAttach)) {
                $userIdsToAttach[] = $creatorId;
            }
            if (!empty($userIdsToAttach)) {
                $album->usuarios()->attach(array_unique($userIdsToAttach));
                Log::info('Attached users to album ' . $album->id . ': ' . implode(', ', array_unique($userIdsToAttach)));
            }
        } else {
             Log::warning('Method usuarios() does not exist on Album model for album ID ' . $album->id);
        }

        return redirect()->route('albumes.index')->with('success', 'Album creado exitosamente.');
    }


    public function show($id)
    {
        $user = Auth::user();
        $album = Album::findOrFail($id);



        if ($user) {
            $album->can = [
                'view'   => true,
                'edit'   => $user->can('update', $album),
                'delete' => $user->can('delete', $album),
            ];
        } else {
             $album->can = [
                 'view'   => true,
                 'edit'   => false,
                 'delete' => false,
             ];
        }

        $album->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id');
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }
        ]);

         // Ensure imagen_url is appended if needed (check Album model $appends)
         if ($album->imagen_url) {
             $album->imagen_url = $album->imagen_url;
         }

        return Inertia::render('albumes/Show', [
            'album' => $album,
        ]);
    }


    public function edit($id)
    {
        $album = Album::with(['usuarios' => function ($query) {
                 $query->select('users.id', 'users.name', 'users.email');
             }])->findOrFail($id);

        $this->authorize('update', $album);

         if ($album->imagen_url) {
             $album->imagen_url = $album->imagen_url;
         }

        return Inertia::render('albumes/Edit', [
            'album' => $album,
        ]);
    }

    public function update(UpdateAlbumRequest $request, $id)
    {
        $album = Album::findOrFail($id);
        $this->authorize('update', $album);

        $datosValidados = $request->validated();

        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'album_images';
        $rutaImagenAntigua = $album->imagen;

        if ($request->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $request->file('imagen_nueva');
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
            }
            $nuevaRutaImagen = $nuevoArchivoImagen->store($carpetaDestino, 'public');
            $datosValidados['imagen'] = $nuevaRutaImagen;
        } elseif ($eliminarImagen) {
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
             }
             $datosValidados['imagen'] = null;
        } else {
             unset($datosValidados['imagen']);
        }

        $album->update($datosValidados);

        if (method_exists($album, 'usuarios')) {
             $validatedUserIds = $request->validate([
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
            ]);
            $userIdsToSync = $validatedUserIds['userIds'] ?? [];

            $album->usuarios()->sync(array_unique($userIdsToSync));
        }

        return Redirect::route('albumes.show', $album->id)
                        ->with('success', 'Album actualizado exitosamente.');
    }


    public function destroy($id)
    {
        $album = Album::findOrFail($id);
        $this->authorize('delete', $album);

        if (method_exists($album, 'usuarios')) {
            $album->usuarios()->detach();
        }
        if (method_exists($album, 'canciones')) {
            $album->canciones()->detach();
        }
        if ($album->imagen && Storage::disk('public')->exists($album->imagen)) {
            Storage::disk('public')->delete($album->imagen);
        }
        $album->delete();
        return redirect()->route('albumes.index')->with('success', 'Album eliminado exitosamente.');
    }

    public function anadirCancion(Request $request, Album $album)
    {
        $this->authorize('update', $album);
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        if (!$album->canciones()->where('canciones.id', $idCancion)->exists()) {
             $album->canciones()->attach($idCancion);
             $message = 'Canción añadida al album.';
        } else {
            $message = 'Esta canción ya está en el album.';
        }

        return redirect()->route('albumes.show', $album->id)
                         ->with('success', $message);
    }

    public function quitarCancionPorPivot(Request $request, Album $album, $pivotId)
    {
        $this->authorize('update', $album);

        $deleted = $album->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $message = $deleted ? 'Canción eliminada del album.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
            Log::warning('Intento de eliminar registro pivot no encontrado', ['album_id' => $album->id, 'pivot_id' => $pivotId]);
        }

        return redirect()->route('albumes.show', $album->id)
                         ->with($deleted ? 'success' : 'error', $message);
    }

    public function buscarCanciones(Request $request, Album $album)
    {

        $consulta = $request->input('query', '');
        $minQueryLength = 2;

        $collaboratorIds = $album->usuarios()->pluck('users.id')->toArray();

        $query = Cancion::whereHas('usuarios', function ($q) use ($collaboratorIds) {
            $q->whereIn('users.id', $collaboratorIds);
        });

        $limit = 30;

        if (strlen($consulta) >= $minQueryLength) {
            $query->where('titulo', 'LIKE', "%{$consulta}%");
            $limit = 15;
        } else {
             $query->orderBy('titulo');
        }

        $resultados = $query->select('id', 'titulo', 'foto_url')
                             ->limit($limit)
                             ->get();

        return response()->json($resultados);
    }
}
