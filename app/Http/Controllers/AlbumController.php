<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAlbumRequest;
use App\Http\Requests\UpdateAlbumRequest;
use App\Models\Album;
use App\Models\Cancion;
use App\Models\User; // Import User model if needed for search, although search is separate
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect; // Import Redirect

class AlbumController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $albumes = Album::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest()->get();


        $albumesConPermisos = $albumes->map(function ($album) use ($user) {
            if ($user) {
                $album->can = [
                    'edit' => $user->can('update', $album),
                    'delete' => $user->can('delete', $album),
                ];
            } else {
                 $album->can = [
                    'edit' => false,
                    'delete' => false,
                ];
            }
            return $album;
        });
        return Inertia::render('albumes/Index', [
            'albumes' => $albumesConPermisos,
        ]);
    }

    public function create()
    {
        // $this->authorize('create', Album::class);
        return Inertia::render('albumes/Create');
    }

    public function store(StoreAlbumRequest $request)
    {
        // $this->authorize('create', Album::class);
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('album_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $album = Album::create($datosValidados);

        if (method_exists($album, 'usuarios')) {
            $userIdsToAttach = $request->input('userIds', []);
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

        return redirect()->route('albumes.index')->with('success', 'Album creada exitosamente.');
    }

    public function show($id)
    {
        $user = Auth::user();
        $album = Album::find($id);
        if ($user) {
            $album->can = [
                'view'   => $user->can('view', $album),
                 'edit' => $user->can('update', $album),
                 'delete' => $user->can('delete', $album),
            ];
        } else {
            $album->can = [
                'view'   => true,
                 'edit' => false,
                 'delete' => false,
            ];
        }

        // Eager load relationships with specific columns for efficiency
        $album->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id'); // Alias pivot ID
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name'); // Only load necessary user fields
            }
        ]);


        return Inertia::render('albumes/Show', [
            'album' => $album,
        ]);
    }


    public function edit($id)
    {
        $album = Album::find($id);
        $this->authorize('edit', $album);
        // Eager load users for the edit form's initial state
        $album->load(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name', 'users.email'); // Load necessary fields for display/state
        }]);
        return Inertia::render('albumes/Edit', [
            'album' => $album,
        ]);
    }

    public function update(UpdateAlbumRequest $request, $id)
    {
        $album = Album::find($id);
        $this->authorize('update', $album);

        // Log::info('Update Request Data:', $request->except(['_method', 'imagen_nueva']));
        // Log::info('Update Request Files:', $request->allFiles());

        // Use validated data from UpdateAlbumRequest
        $datosValidados = $request->validated();

        // Also validate userIds here or ensure it's in UpdateAlbumRequest rules
        $validatedUserIds = $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $album = $album;

        $album->nombre = $datosValidados['nombre'];
        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'album_images';
        $rutaImagenAntigua = $album->imagen;

        if ($request->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $request->file('imagen_nueva');
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
            }
            $nuevaRutaImagen = $nuevoArchivoImagen->store($carpetaDestino, 'public');
            $album->imagen = $nuevaRutaImagen;
        } elseif ($eliminarImagen) {
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
                $album->imagen = null;
            } elseif ($album->imagen) {
                $album->imagen = null;
            }
        }

        $album->save();

        // Sync users
        if (method_exists($album, 'usuarios')) {
            $userIdsToSync = $validatedUserIds['userIds'] ?? [];

            // Optional: Ensure creator is always present if required by your app rules
            // $creatorId = $album->usuarios()->wherePivot('is_creator', true)->value('id') ?? Auth::id(); // Example: Get creator ID
            // if ($creatorId && !in_array($creatorId, $userIdsToSync)) {
            //     $userIdsToSync[] = $creatorId;
            // }

            $album->usuarios()->sync(array_unique($userIdsToSync));
            // Log::info('Synced users for album ' . $album->id . ': ' . implode(', ', array_unique($userIdsToSync)));
        } else {
            // Log::warning('Method usuarios() does not exist on Album model for album ID ' . $album->id . ' during update.');
        }

        // Redirect to show page which will have updated data
        return Redirect::route('albumes.show', $album->id)
                       ->with('success', 'Album actualizada exitosamente.');
    }


    public function destroy($id)
    {
        $album = Album::find($id);
        $this->authorize('delete', $album);
        if (method_exists($album, 'usuarios')) {
             $album->usuarios()->detach();
        }
        if (method_exists($album, 'canciones')) {
             $album->canciones()->detach();
        }
        if ($album->imagen) {
            Storage::disk('public')->delete($album->imagen);
        }
        $album->delete();
        return redirect()->route('albumes.index')->with('success', 'Album eliminada exitosamente.');
    }

    public function anadirCancion(Request $request, Album $album)
    {
        $this->authorize('update', $album); // Recommended to authorize this
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        $album->canciones()->attach($idCancion);

        $album->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('albumes.show', $album->id)
                         ->with('success', 'Canción añadida a la album.')
                         ->with('album', $album); // Ensure album is passed if needed by view after redirect
    }

    public function quitarCancionPorPivot(Request $request, Album $album, $pivotId)
    {
        $this->authorize('update', $album); // Recommended to authorize this

        $deleted = $album->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $message = $deleted ? 'Canción eliminada de la album.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
             Log::warning('Intento de eliminar registro pivot no encontrado', ['album_id' => $album->id, 'pivot_id' => $pivotId]);
        }

        $album->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('albumes.show', $album->id)
                         ->with('success', $message)
                         ->with('album', $album); // Ensure album is passed if needed
    }

    public function buscarCanciones(Request $request, Album $album)
    {
        $consulta = $request->input('query', '');
        $minQueryLength = 2;

        $artistIds = $album->usuarios()->pluck('users.id')->toArray();

        $query = Cancion::whereHas('usuarios', function ($q) use ($artistIds) {
            $q->whereIn('users.id', $artistIds);
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
