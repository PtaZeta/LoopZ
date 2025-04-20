<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlaylistRequest;
use App\Http\Requests\UpdatePlaylistRequest;
use App\Models\Playlist;
use App\Models\Cancion;
use App\Models\User; // Import User model if needed for search, although search is separate
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect; // Import Redirect

class PlaylistController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $playlistsQuery = Playlist::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest();

        if ($user) {
             $playlistsQuery->where('publico', true)
                         ->orWhereHas('usuarios', function ($query) use ($user) {
                             $query->where('users.id', $user->id);
                         });
        } else {
            $playlistsQuery->where('publico', true);
        }

        $playlists = $playlistsQuery->get();


        $playlistsConPermisos = $playlists->map(function ($playlist) use ($user) {
            if ($user) {
                $playlist->can = [
                    'view'   => $user->can('view', $playlist),
                    'edit'   => $user->can('update', $playlist),
                    'delete' => $user->can('delete', $playlist),
                ];
            } else {
                 $playlist->can = [
                    'view'   => $playlist->publico,
                    'edit'   => false,
                    'delete' => false,
                 ];
            }
            // Ensure imagen_url is appended if needed (check Playlist model $appends)
            if ($playlist->imagen_url) {
                 $playlist->imagen_url = $playlist->imagen_url;
             }
            return $playlist;
        });
        return Inertia::render('playlists/Index', [
            'playlists' => $playlistsConPermisos,
        ]);
    }

    public function create()
    {
        // $this->authorize('create', Playlist::class);
        return Inertia::render('playlists/Create');
    }

    public function store(StorePlaylistRequest $request)
    {
        // $this->authorize('create', Playlist::class);
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('playlist_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $listaReproduccion = Playlist::create($datosValidados);

        if (method_exists($listaReproduccion, 'usuarios')) {
            $userIdsToAttach = $request->input('userIds', []);
            $creatorId = Auth::id();
            if ($creatorId && !in_array($creatorId, $userIdsToAttach)) {
                $userIdsToAttach[] = $creatorId;
            }
            if (!empty($userIdsToAttach)) {
                $listaReproduccion->usuarios()->attach(array_unique($userIdsToAttach));
                Log::info('Attached users to playlist ' . $listaReproduccion->id . ': ' . implode(', ', array_unique($userIdsToAttach)));
            }
        } else {
             Log::warning('Method usuarios() does not exist on Playlist model for playlist ID ' . $listaReproduccion->id);
        }

        return redirect()->route('playlists.index')->with('success', 'Playlist creada exitosamente.');
    }

    public function show(Playlist $playlist)
    {
        $user = Auth::user();

        if ($user) {
            $playlist->can = [
                'view'   => $user->can('view', $playlist),
                 'edit' => $user->can('update', $playlist),
                 'delete' => $user->can('delete', $playlist),
            ];
        } else {
            $playlist->can = [
                'view'   => true,
                 'edit' => false,
                 'delete' => false,
            ];
        }

        // Eager load relationships with specific columns for efficiency
        $playlist->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id'); // Alias pivot ID
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name'); // Only load necessary user fields
            }
        ]);


        return Inertia::render('playlists/Show', [
            'playlist' => $playlist,
        ]);
    }


    public function edit(Playlist $playlist)
    {
        $this->authorize('update', $playlist);
        // Eager load users for the edit form's initial state
        $playlist->load(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name', 'users.email'); // Load necessary fields for display/state
        }]);
        return Inertia::render('playlists/Edit', [
            'playlist' => $playlist,
        ]);
    }

    public function update(UpdatePlaylistRequest $request, Playlist $playlist)
    {
        $this->authorize('update', $playlist);

        // Log::info('Update Request Data:', $request->except(['_method', 'imagen_nueva']));
        // Log::info('Update Request Files:', $request->allFiles());

        // Use validated data from UpdatePlaylistRequest
        $datosValidados = $request->validated();

        // Also validate userIds here or ensure it's in UpdatePlaylistRequest rules
        $validatedUserIds = $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $listaReproduccion = $playlist;

        $listaReproduccion->nombre = $datosValidados['nombre'];
        $listaReproduccion->descripcion = $datosValidados['descripcion'];

        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'playlist_images';
        $rutaImagenAntigua = $listaReproduccion->imagen;

        if ($request->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $request->file('imagen_nueva');
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
            }
            $nuevaRutaImagen = $nuevoArchivoImagen->store($carpetaDestino, 'public');
            $listaReproduccion->imagen = $nuevaRutaImagen;
        } elseif ($eliminarImagen) {
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
                $listaReproduccion->imagen = null;
            } elseif ($listaReproduccion->imagen) {
                $listaReproduccion->imagen = null;
            }
        }

        $listaReproduccion->update($datosValidados);

        // Sync users
        if (method_exists($listaReproduccion, 'usuarios')) {
            $userIdsToSync = $validatedUserIds['userIds'] ?? [];

            // Optional: Ensure creator is always present if required by your app rules
            // $creatorId = $listaReproduccion->usuarios()->wherePivot('is_creator', true)->value('id') ?? Auth::id(); // Example: Get creator ID
            // if ($creatorId && !in_array($creatorId, $userIdsToSync)) {
            //     $userIdsToSync[] = $creatorId;
            // }

            $listaReproduccion->usuarios()->sync(array_unique($userIdsToSync));
            // Log::info('Synced users for playlist ' . $listaReproduccion->id . ': ' . implode(', ', array_unique($userIdsToSync)));
        } else {
            // Log::warning('Method usuarios() does not exist on Playlist model for playlist ID ' . $listaReproduccion->id . ' during update.');
        }

        // Redirect to show page which will have updated data
        return Redirect::route('playlists.show', $listaReproduccion->id)
                       ->with('success', 'Playlist actualizada exitosamente.');
    }


    public function destroy(Playlist $playlist)
    {
        $this->authorize('delete', $playlist);
        if (method_exists($playlist, 'usuarios')) {
             $playlist->usuarios()->detach();
        }
        if (method_exists($playlist, 'canciones')) {
             $playlist->canciones()->detach();
        }
        if ($playlist->imagen) {
            Storage::disk('public')->delete($playlist->imagen);
        }
        $playlist->delete();
        return redirect()->route('playlists.index')->with('success', 'Playlist eliminada exitosamente.');
    }

    public function anadirCancion(Request $request, Playlist $playlist)
    {
        $this->authorize('update', $playlist); // Recommended to authorize this
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        $playlist->canciones()->attach($idCancion);

        $playlist->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('playlists.show', $playlist->id)
                         ->with('success', 'Canción añadida a la playlist.')
                         ->with('playlist', $playlist); // Ensure playlist is passed if needed by view after redirect
    }

    public function quitarCancionPorPivot(Request $request, Playlist $playlist, $pivotId)
    {
        $this->authorize('update', $playlist); // Recommended to authorize this

        $deleted = $playlist->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $message = $deleted ? 'Canción eliminada de la playlist.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
             Log::warning('Intento de eliminar registro pivot no encontrado', ['playlist_id' => $playlist->id, 'pivot_id' => $pivotId]);
        }

        $playlist->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('playlists.show', $playlist->id)
                         ->with('success', $message)
                         ->with('playlist', $playlist); // Ensure playlist is passed if needed
    }

    public function buscarCanciones(Request $request, Playlist $playlist)
    {
        $user = Auth::user();
        $consulta = $request->input('query', '');
        $minQueryLength = 2;
        $limit = 30;

        $collaboratorIds = $playlist
            ->usuarios()
            ->pluck('users.id')
            ->toArray();

        $query = Cancion::query()
            ->with('usuarios')
            ->where(function ($q) use ($user, $collaboratorIds) {
                $q->where('publico', true);
                if ($user) {
                    $q->orWhereHas('usuarios', function ($q2) use ($collaboratorIds) {
                        $q2->whereIn('users.id', $collaboratorIds);
                    });
                }
            });

        if (strlen($consulta) >= $minQueryLength) {
            $query->where('titulo', 'LIKE', "%{$consulta}%");
            $limit = 15;
        } else {
            $query->orderBy('titulo');
        }

        $resultados = $query
            ->select('id', 'titulo', 'foto_url')
            ->limit($limit)
            ->get();

        return response()->json($resultados);
    }

}
