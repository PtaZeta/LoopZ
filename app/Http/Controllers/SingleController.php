<?php
// app/Http/Controllers/SingleController.php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSingleRequest;
use App\Http\Requests\UpdateSingleRequest;
use App\Models\Single;
use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class SingleController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $singlesQuery = Single::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest();

        if ($user) {
             $singlesQuery->where('publico', true)
                         ->orWhereHas('usuarios', function ($query) use ($user) {
                             $query->where('users.id', $user->id);
                         });
        } else {
            $singlesQuery->where('publico', true);
        }

        $singles = $singlesQuery->get();


        $singlesConPermisos = $singles->map(function ($single) use ($user) {
            if ($user) {
                $single->can = [
                    'view'   => $user->can('view', $single),
                    'edit'   => $user->can('update', $single),
                    'delete' => $user->can('delete', $single),
                ];
            } else {
                 $single->can = [
                    'view'   => $single->publico,
                    'edit'   => false,
                    'delete' => false,
                 ];
            }
            // Ensure imagen_url is appended if needed (check Single model $appends)
            if ($single->imagen_url) {
                 $single->imagen_url = $single->imagen_url;
             }
            return $single;
        });
        return Inertia::render('singles/Index', [
            'singles' => $singlesConPermisos,
        ]);
    }

    public function create()
    {
        return Inertia::render('singles/Create');
    }

    public function store(StoreSingleRequest $request)
    {
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('single_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
             unset($datosValidados['imagen']);
        }

        $validatedUserIds = $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $single = Single::create($datosValidados);

        if (method_exists($single, 'usuarios')) {
            $userIdsToAttach = $validatedUserIds['userIds'] ?? [];
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

        return redirect()->route('singles.index')->with('success', 'Single creado exitosamente.');
    }


    public function show($id)
    {
        $user = Auth::user();
        $single = Single::findOrFail($id);



        if ($user) {
            $single->can = [
                'view'   => true,
                'edit'   => $user->can('update', $single),
                'delete' => $user->can('delete', $single),
            ];
        } else {
             $single->can = [
                 'view'   => true,
                 'edit'   => false,
                 'delete' => false,
             ];
        }

        $single->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id');
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }
        ]);

         // Ensure imagen_url is appended if needed (check Single model $appends)
         if ($single->imagen_url) {
             $single->imagen_url = $single->imagen_url;
         }

        return Inertia::render('singles/Show', [
            'single' => $single,
        ]);
    }


    public function edit($id)
    {
        $single = Single::with(['usuarios' => function ($query) {
                 $query->select('users.id', 'users.name', 'users.email');
             }])->findOrFail($id);

        $this->authorize('update', $single);

         if ($single->imagen_url) {
             $single->imagen_url = $single->imagen_url;
         }

        return Inertia::render('singles/Edit', [
            'single' => $single,
        ]);
    }

    public function update(UpdateSingleRequest $request, $id)
    {
        $single = Single::findOrFail($id);
        $this->authorize('update', $single);

        $datosValidados = $request->validated();

        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'single_images';
        $rutaImagenAntigua = $single->imagen;

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

        $single->update($datosValidados);

        if (method_exists($single, 'usuarios')) {
             $validatedUserIds = $request->validate([
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
            ]);
            $userIdsToSync = $validatedUserIds['userIds'] ?? [];

            $single->usuarios()->sync(array_unique($userIdsToSync));
        }

        return Redirect::route('singles.show', $single->id)
                        ->with('success', 'Single actualizado exitosamente.');
    }


    public function destroy($id)
    {
        $single = Single::findOrFail($id);
        $this->authorize('delete', $single);

        if (method_exists($single, 'usuarios')) {
            $single->usuarios()->detach();
        }
        if (method_exists($single, 'canciones')) {
            $single->canciones()->detach();
        }
        if ($single->imagen && Storage::disk('public')->exists($single->imagen)) {
            Storage::disk('public')->delete($single->imagen);
        }
        $single->delete();
        return redirect()->route('singles.index')->with('success', 'Single eliminado exitosamente.');
    }

    public function anadirCancion(Request $request, Single $single)
    {
        $this->authorize('update', $single);
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        if (!$single->canciones()->where('canciones.id', $idCancion)->exists()) {
             $single->canciones()->attach($idCancion);
             $message = 'Canción añadida al single.';
        } else {
            $message = 'Esta canción ya está en el single.';
        }

        return redirect()->route('singles.show', $single->id)
                         ->with('success', $message);
    }

    public function quitarCancionPorPivot(Request $request, Single $single, $pivotId)
    {
        $this->authorize('update', $single);

        $deleted = $single->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $message = $deleted ? 'Canción eliminada del single.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
            Log::warning('Intento de eliminar registro pivot no encontrado', ['single_id' => $single->id, 'pivot_id' => $pivotId]);
        }

        return redirect()->route('singles.show', $single->id)
                         ->with($deleted ? 'success' : 'error', $message);
    }

    public function buscarCanciones(Request $request, Single $single)
    {

        $consulta = $request->input('query', '');
        $minQueryLength = 2;

        $collaboratorIds = $single->usuarios()->pluck('users.id')->toArray();

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
