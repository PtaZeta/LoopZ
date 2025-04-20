<?php
// app/Http/Controllers/EPController.php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEPRequest;
use App\Http\Requests\UpdateEPRequest;
use App\Models\EP;
use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class EPController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $epsQuery = EP::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest();

        if ($user) {
             $epsQuery->where('publico', true)
                         ->orWhereHas('usuarios', function ($query) use ($user) {
                             $query->where('users.id', $user->id);
                         });
        } else {
            $epsQuery->where('publico', true);
        }

        $eps = $epsQuery->get();


        $epsConPermisos = $eps->map(function ($ep) use ($user) {
            if ($user) {
                $ep->can = [
                    'view'   => $user->can('view', $ep),
                    'edit'   => $user->can('update', $ep),
                    'delete' => $user->can('delete', $ep),
                ];
            } else {
                 $ep->can = [
                    'view'   => $ep->publico,
                    'edit'   => false,
                    'delete' => false,
                 ];
            }
            // Ensure imagen_url is appended if needed (check EP model $appends)
            if ($ep->imagen_url) {
                 $ep->imagen_url = $ep->imagen_url;
             }
            return $ep;
        });
        return Inertia::render('eps/Index', [
            'eps' => $epsConPermisos,
        ]);
    }

    public function create()
    {
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

        $validatedUserIds = $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $ep = EP::create($datosValidados);

        if (method_exists($ep, 'usuarios')) {
            $userIdsToAttach = $validatedUserIds['userIds'] ?? [];
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

        return redirect()->route('eps.index')->with('success', 'EP creado exitosamente.');
    }


    public function show($id)
    {
        $user = Auth::user();
        $ep = EP::findOrFail($id);



        if ($user) {
            $ep->can = [
                'view'   => true,
                'edit'   => $user->can('update', $ep),
                'delete' => $user->can('delete', $ep),
            ];
        } else {
             $ep->can = [
                 'view'   => true,
                 'edit'   => false,
                 'delete' => false,
             ];
        }

        $ep->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id');
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }
        ]);

         // Ensure imagen_url is appended if needed (check EP model $appends)
         if ($ep->imagen_url) {
             $ep->imagen_url = $ep->imagen_url;
         }

        return Inertia::render('eps/Show', [
            'ep' => $ep,
        ]);
    }


    public function edit($id)
    {
        $ep = EP::with(['usuarios' => function ($query) {
                 $query->select('users.id', 'users.name', 'users.email');
             }])->findOrFail($id);

        $this->authorize('update', $ep);

         if ($ep->imagen_url) {
             $ep->imagen_url = $ep->imagen_url;
         }

        return Inertia::render('eps/Edit', [
            'ep' => $ep,
        ]);
    }

    public function update(UpdateEPRequest $request, $id)
    {
        $ep = EP::findOrFail($id);
        $this->authorize('update', $ep);

        $datosValidados = $request->validated();

        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'ep_images';
        $rutaImagenAntigua = $ep->imagen;

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

        $ep->update($datosValidados);

        if (method_exists($ep, 'usuarios')) {
             $validatedUserIds = $request->validate([
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
            ]);
            $userIdsToSync = $validatedUserIds['userIds'] ?? [];

            $ep->usuarios()->sync(array_unique($userIdsToSync));
        }

        return Redirect::route('eps.show', $ep->id)
                        ->with('success', 'EP actualizado exitosamente.');
    }


    public function destroy($id)
    {
        $ep = EP::findOrFail($id);
        $this->authorize('delete', $ep);

        if (method_exists($ep, 'usuarios')) {
            $ep->usuarios()->detach();
        }
        if (method_exists($ep, 'canciones')) {
            $ep->canciones()->detach();
        }
        if ($ep->imagen && Storage::disk('public')->exists($ep->imagen)) {
            Storage::disk('public')->delete($ep->imagen);
        }
        $ep->delete();
        return redirect()->route('eps.index')->with('success', 'EP eliminado exitosamente.');
    }

    public function anadirCancion(Request $request, EP $ep)
    {
        $this->authorize('update', $ep);
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        if (!$ep->canciones()->where('canciones.id', $idCancion)->exists()) {
             $ep->canciones()->attach($idCancion);
             $message = 'Canción añadida al ep.';
        } else {
            $message = 'Esta canción ya está en el ep.';
        }

        return redirect()->route('eps.show', $ep->id)
                         ->with('success', $message);
    }

    public function quitarCancionPorPivot(Request $request, EP $ep, $pivotId)
    {
        $this->authorize('update', $ep);

        $deleted = $ep->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $message = $deleted ? 'Canción eliminada del ep.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
            Log::warning('Intento de eliminar registro pivot no encontrado', ['ep_id' => $ep->id, 'pivot_id' => $pivotId]);
        }

        return redirect()->route('eps.show', $ep->id)
                         ->with($deleted ? 'success' : 'error', $message);
    }

    public function buscarCanciones(Request $request, EP $ep)
    {

        $consulta = $request->input('query', '');
        $minQueryLength = 2;

        $collaboratorIds = $ep->usuarios()->pluck('users.id')->toArray();

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
