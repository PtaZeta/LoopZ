<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEPRequest;
use App\Http\Requests\UpdateEPRequest;
use App\Models\EP;
use App\Models\Cancion;
use App\Models\User; // Import User model if needed for search, although search is separate
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect; // Import Redirect

class EPController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $eps = EP::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest()->get();


        $epsConPermisos = $eps->map(function ($ep) use ($user) {
            if ($user) {
                $ep->can = [
                    'edit' => $user->can('update', $ep),
                    'delete' => $user->can('delete', $ep),
                ];
            } else {
                 $ep->can = [
                    'edit' => false,
                    'delete' => false,
                ];
            }
            return $ep;
        });
        return Inertia::render('eps/Index', [
            'eps' => $epsConPermisos,
        ]);
    }

    public function create()
    {
        // $this->authorize('create', EP::class);
        return Inertia::render('eps/Create');
    }

    public function store(StoreEPRequest $request)
    {
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('ep_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $ep = EP::create($datosValidados);

        if (method_exists($ep, 'usuarios')) {
            $userIdsToAttach = $request->input('userIds', []);
            $creatorId = Auth::id();
            if ($creatorId && !in_array($creatorId, $userIdsToAttach)) {
                $userIdsToAttach[] = $creatorId;
            }
            if (!empty($userIdsToAttach)) {
                $ep->usuarios()->attach(array_unique($userIdsToAttach));
                Log::info('Attached users to ep ' . $ep->id . ': ' . implode(', ', array_unique($userIdsToAttach)));
            }
        } else {
             Log::warning('Method usuarios() does not exist on EP model for ep ID ' . $ep->id);
        }

        return redirect()->route('eps.index')->with('success', 'EP creada exitosamente.');
    }

    public function show($id)
    {
        $user = Auth::user();
        $ep = EP::find($id);
        if ($user) {
            $ep->can = [
                'view'   => $user->can('view', $ep),
                 'edit' => $user->can('update', $ep),
                 'delete' => $user->can('delete', $ep),
            ];
        } else {
            $ep->can = [
                'view'   => true,
                 'edit' => false,
                 'delete' => false,
            ];
        }

        // Eager load relationships with specific columns for efficiency
        $ep->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id'); // Alias pivot ID
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name'); // Only load necessary user fields
            }
        ]);


        return Inertia::render('eps/Show', [
            'ep' => $ep,
        ]);
    }


    public function edit($id)
    {
        $ep = EP::find($id);
        $this->authorize('edit', $ep);
        // Eager load users for the edit form's initial state
        $ep->load(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name', 'users.email'); // Load necessary fields for display/state
        }]);
        return Inertia::render('eps/Edit', [
            'ep' => $ep,
        ]);
    }

    public function update(UpdateEPRequest $request, $id)
    {
        $ep = EP::find($id);
        $this->authorize('update', $ep);

        // Log::info('Update Request Data:', $request->except(['_method', 'imagen_nueva']));
        // Log::info('Update Request Files:', $request->allFiles());

        // Use validated data from UpdateEPRequest
        $datosValidados = $request->validated();

        // Also validate userIds here or ensure it's in UpdateEPRequest rules
        $validatedUserIds = $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $ep = $ep;

        $ep->nombre = $datosValidados['nombre'];
        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'ep_images';
        $rutaImagenAntigua = $ep->imagen;

        if ($request->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $request->file('imagen_nueva');
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
            }
            $nuevaRutaImagen = $nuevoArchivoImagen->store($carpetaDestino, 'public');
            $ep->imagen = $nuevaRutaImagen;
        } elseif ($eliminarImagen) {
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
                $ep->imagen = null;
            } elseif ($ep->imagen) {
                $ep->imagen = null;
            }
        }

        $ep->save();

        // Sync users
        if (method_exists($ep, 'usuarios')) {
            $userIdsToSync = $validatedUserIds['userIds'] ?? [];

            // Optional: Ensure creator is always present if required by your app rules
            // $creatorId = $ep->usuarios()->wherePivot('is_creator', true)->value('id') ?? Auth::id(); // Example: Get creator ID
            // if ($creatorId && !in_array($creatorId, $userIdsToSync)) {
            //     $userIdsToSync[] = $creatorId;
            // }

            $ep->usuarios()->sync(array_unique($userIdsToSync));
            // Log::info('Synced users for ep ' . $ep->id . ': ' . implode(', ', array_unique($userIdsToSync)));
        } else {
            // Log::warning('Method usuarios() does not exist on EP model for ep ID ' . $ep->id . ' during update.');
        }

        // Redirect to show page which will have updated data
        return Redirect::route('eps.show', $ep->id)
                       ->with('success', 'EP actualizada exitosamente.');
    }


    public function destroy($id)
    {
        $ep = EP::find($id);
        $this->authorize('delete', $ep);
        if (method_exists($ep, 'usuarios')) {
             $ep->usuarios()->detach();
        }
        if (method_exists($ep, 'canciones')) {
             $ep->canciones()->detach();
        }
        if ($ep->imagen) {
            Storage::disk('public')->delete($ep->imagen);
        }
        $ep->delete();
        return redirect()->route('eps.index')->with('success', 'EP eliminada exitosamente.');
    }

    public function anadirCancion(Request $request, EP $ep)
    {
        $this->authorize('update', $ep); // Recommended to authorize this
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        $ep->canciones()->attach($idCancion);

        $ep->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('eps.show', $ep->id)
                         ->with('success', 'Canción añadida a la ep.')
                         ->with('ep', $ep); // Ensure ep is passed if needed by view after redirect
    }

    public function quitarCancionPorPivot(Request $request, EP $ep, $pivotId)
    {
        $this->authorize('update', $ep); // Recommended to authorize this

        $deleted = $ep->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $message = $deleted ? 'Canción eliminada de la ep.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
             Log::warning('Intento de eliminar registro pivot no encontrado', ['ep_id' => $ep->id, 'pivot_id' => $pivotId]);
        }

        $ep->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('eps.show', $ep->id)
                         ->with('success', $message)
                         ->with('ep', $ep); // Ensure ep is passed if needed
    }

    public function buscarCanciones(Request $request, EP $ep)
    {
        $consulta = $request->input('query', '');
        $minQueryLength = 2;

        $artistIds = $ep->usuarios()->pluck('users.id')->toArray();

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
