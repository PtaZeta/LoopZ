<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSingleRequest;
use App\Http\Requests\UpdateSingleRequest;
use App\Models\Single;
use App\Models\Cancion;
use App\Models\User; // Import User model if needed for search, although search is separate
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect; // Import Redirect

class SingleController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $singles = Single::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest()->get();


        $singlesConPermisos = $singles->map(function ($single) use ($user) {
            if ($user) {
                $single->can = [
                    'edit' => $user->can('update', $single),
                    'delete' => $user->can('delete', $single),
                ];
            } else {
                 $single->can = [
                    'edit' => false,
                    'delete' => false,
                ];
            }
            return $single;
        });
        return Inertia::render('singles/Index', [
            'singles' => $singlesConPermisos,
        ]);
    }

    public function create()
    {
        // $this->authorize('create', Single::class);
        return Inertia::render('singles/Create');
    }

    public function store(StoreSingleRequest $request)
    {
        // $this->authorize('create', Single::class);
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('single_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $single = Single::create($datosValidados);

        if (method_exists($single, 'usuarios')) {
            $userIdsToAttach = $request->input('userIds', []);
            $creatorId = Auth::id();
            if ($creatorId && !in_array($creatorId, $userIdsToAttach)) {
                $userIdsToAttach[] = $creatorId;
            }
            if (!empty($userIdsToAttach)) {
                $single->usuarios()->attach(array_unique($userIdsToAttach));
                Log::info('Attached users to single ' . $single->id . ': ' . implode(', ', array_unique($userIdsToAttach)));
            }
        } else {
             Log::warning('Method usuarios() does not exist on Single model for single ID ' . $single->id);
        }

        return redirect()->route('singles.index')->with('success', 'Single creada exitosamente.');
    }

    public function show($id)
    {
        $user = Auth::user();
        $single = Single::find($id);
        if ($user) {
            $single->can = [
                'view'   => $user->can('view', $single),
                 'edit' => $user->can('update', $single),
                 'delete' => $user->can('delete', $single),
            ];
        } else {
            $single->can = [
                'view'   => true,
                 'edit' => false,
                 'delete' => false,
            ];
        }

        // Eager load relationships with specific columns for efficiency
        $single->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id'); // Alias pivot ID
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name'); // Only load necessary user fields
            }
        ]);


        return Inertia::render('singles/Show', [
            'single' => $single,
        ]);
    }


    public function edit($id)
    {
        $single = Single::find($id);
        $this->authorize('edit', $single);
        // Eager load users for the edit form's initial state
        $single->load(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name', 'users.email'); // Load necessary fields for display/state
        }]);
        return Inertia::render('singles/Edit', [
            'single' => $single,
        ]);
    }

    public function update(UpdateSingleRequest $request, $id)
    {
        $single = Single::find($id);
        $this->authorize('update', $single);

        // Log::info('Update Request Data:', $request->except(['_method', 'imagen_nueva']));
        // Log::info('Update Request Files:', $request->allFiles());

        // Use validated data from UpdateSingleRequest
        $datosValidados = $request->validated();

        // Also validate userIds here or ensure it's in UpdateSingleRequest rules
        $validatedUserIds = $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $single = $single;

        $single->nombre = $datosValidados['nombre'];
        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'single_images';
        $rutaImagenAntigua = $single->imagen;

        if ($request->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $request->file('imagen_nueva');
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
            }
            $nuevaRutaImagen = $nuevoArchivoImagen->store($carpetaDestino, 'public');
            $single->imagen = $nuevaRutaImagen;
        } elseif ($eliminarImagen) {
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
                $single->imagen = null;
            } elseif ($single->imagen) {
                $single->imagen = null;
            }
        }

        $single->save();

        // Sync users
        if (method_exists($single, 'usuarios')) {
            $userIdsToSync = $validatedUserIds['userIds'] ?? [];

            // Optional: Ensure creator is always present if required by your app rules
            // $creatorId = $single->usuarios()->wherePivot('is_creator', true)->value('id') ?? Auth::id(); // Example: Get creator ID
            // if ($creatorId && !in_array($creatorId, $userIdsToSync)) {
            //     $userIdsToSync[] = $creatorId;
            // }

            $single->usuarios()->sync(array_unique($userIdsToSync));
            // Log::info('Synced users for single ' . $single->id . ': ' . implode(', ', array_unique($userIdsToSync)));
        } else {
            // Log::warning('Method usuarios() does not exist on Single model for single ID ' . $single->id . ' during update.');
        }

        // Redirect to show page which will have updated data
        return Redirect::route('singles.show', $single->id)
                       ->with('success', 'Single actualizada exitosamente.');
    }


    public function destroy($id)
    {
        $single = Single::find($id);
        $this->authorize('delete', $single);
        if (method_exists($single, 'usuarios')) {
             $single->usuarios()->detach();
        }
        if (method_exists($single, 'canciones')) {
             $single->canciones()->detach();
        }
        if ($single->imagen) {
            Storage::disk('public')->delete($single->imagen);
        }
        $single->delete();
        return redirect()->route('singles.index')->with('success', 'Single eliminada exitosamente.');
    }

    public function anadirCancion(Request $request, Single $single)
    {
        $this->authorize('update', $single); // Recommended to authorize this
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        $single->canciones()->attach($idCancion);

        $single->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('singles.show', $single->id)
                         ->with('success', 'Canción añadida a la single.')
                         ->with('single', $single); // Ensure single is passed if needed by view after redirect
    }

    public function quitarCancionPorPivot(Request $request, Single $single, $pivotId)
    {
        $this->authorize('update', $single); // Recommended to authorize this

        $deleted = $single->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $message = $deleted ? 'Canción eliminada de la single.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
             Log::warning('Intento de eliminar registro pivot no encontrado', ['single_id' => $single->id, 'pivot_id' => $pivotId]);
        }

        $single->load(['canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                  ->withPivot('id as pivot_id'); // Re-load with pivot ID
        }]);

        return redirect()->route('singles.show', $single->id)
                         ->with('success', $message)
                         ->with('single', $single); // Ensure single is passed if needed
    }

    public function buscarCanciones(Request $request, Single $single)
    {
        $consulta = $request->input('query', '');
        $minQueryLength = 2;

        $artistIds = $single->usuarios()->pluck('users.id')->toArray();

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
