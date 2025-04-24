<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContenedorRequest;
use App\Http\Requests\UpdateContenedorRequest;
use App\Models\Contenedor;
use App\Models\Cancion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class ContenedorController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $tipoContenedor = 'playlist';

        $contenedoresQuery = Contenedor::where('tipo', $tipoContenedor)
            ->with(['usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }])
            ->withCount('canciones')
            ->latest();

        if ($user) {
             $contenedoresQuery->where(function ($query) use ($user) {
                $query->where('publico', true)
                      ->orWhereHas('usuarios', function ($subQuery) use ($user) {
                          $subQuery->where('users.id', $user->id);
                      });
            });
        } else {
            $contenedoresQuery->where('publico', true);
        }

        $contenedores = $contenedoresQuery->get();

        $contenedoresConPermisos = $contenedores->map(function ($contenedor) use ($user) {
            if ($user) {
                $contenedor->can = [
                    'view'   => $user->can('view', $contenedor),
                    'edit'   => $user->can('update', $contenedor),
                    'delete' => $user->can('delete', $contenedor),
                ];
            } else {
                 $contenedor->can = [
                    'view'   => $contenedor->publico ?? false,
                    'edit'   => false,
                    'delete' => false,
                ];
            }
            return $contenedor;
        });

        return Inertia::render('playlists/Index', [
            'contenedores' => $contenedoresConPermisos,
        ]);
    }

    public function create()
    {
        return Inertia::render('playlists/Create');
    }

    public function store(StoreContenedorRequest $request)
    {
        $datosValidados = $request->validated();
        $datosValidados['tipo'] = 'playlist';

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('contenedor_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $contenedor = Contenedor::create($datosValidados);

        if (method_exists($contenedor, 'usuarios')) {
            $userIdsInput = $request->input('userIds', []);
            $creatorId = Auth::id();

            $usersToSync = [];

            foreach ($userIdsInput as $userId) {
                if ($userId != $creatorId) {
                    $usersToSync[$userId] = ['propietario' => false];
                }
            }

            if ($creatorId) {
                $usersToSync[$creatorId] = ['propietario' => true];
            }

            if (!empty($usersToSync)) {
                $contenedor->usuarios()->attach($usersToSync);
                Log::info('Attached users to contenedor (playlist) ' . $contenedor->id . ': ' . json_encode($usersToSync));
            }
        } else {
             Log::warning('Method usuarios() does not exist on Contenedor model for contenedor ID ' . $contenedor->id);
        }

        return redirect()->route('playlists.index')
                         ->with('success', 'Playlist creada exitosamente.');
    }

    public function show($id)
    {
        $contenedor = Contenedor::findOrFail($id);
        if ($contenedor->tipo !== 'playlist') {
            abort(404);
        }

        $user = Auth::user();

        $contenedor->load([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id');
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }
        ]);

        if ($user) {
            $contenedor->can = [
                'view'   => $user->can('view', $contenedor),
                'edit'   => $user->can('update', $contenedor),
                'delete' => $user->can('delete', $contenedor),
            ];
        } else {
             $contenedor->can = [
                'view'   => $contenedor->publico ?? false,
                'edit'   => false,
                'delete' => false,
            ];
        }

        return Inertia::render('playlists/Show', [
            'contenedor' => $contenedor,
        ]);
    }

    public function edit($id)
    {
        $contenedor = Contenedor::findOrFail($id);
        if ($contenedor->tipo !== 'playlist') {
            abort(404);
        }
        $this->authorize('update', $contenedor);

        // *** Cargar relación usuarios CON el pivot 'propietario' ***
        $contenedor->load(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name', 'users.email')->withPivot('propietario');
        }]);

        // *** Determinar si el usuario actual es propietario ***
        $isOwner = false;
        if (Auth::check() && method_exists($contenedor, 'usuarios')) {
            $propietario = $contenedor->usuarios()->wherePivot('propietario', true)->first();
            $isOwner = $propietario && $propietario->id === Auth::id();
        }
        // Añadir la bandera al objeto contenedor
        $contenedor->is_owner = $isOwner;


        return Inertia::render('playlists/Edit', [
            'contenedor' => $contenedor,
        ]);
    }

    public function update(UpdateContenedorRequest $request, $id)
    {
        $contenedor = Contenedor::findOrFail($id);
        if ($contenedor->tipo !== 'playlist') {
            abort(404);
        }
        $this->authorize('update', $contenedor);

        $datosValidados = $request->validated();

        // Solo validar y sincronizar userIds si el usuario actual es el propietario
        $isOwner = false;
         if (Auth::check() && method_exists($contenedor, 'usuarios')) {
            $propietario = $contenedor->usuarios()->wherePivot('propietario', true)->first();
            $isOwner = $propietario && $propietario->id === Auth::id();
        }

        if ($isOwner) {
            $usersIdsValidadas = $request->validate([
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
            ]);
        } else {
            // Si no es propietario, no permitir cambiar los userIds
            unset($datosValidados['userIds']);
        }


        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'contenedor_images';
        $rutaImagenAntigua = $contenedor->imagen;

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

        $contenedor->update($datosValidados);

        // Sincronizar usuarios solo si el usuario actual es el propietario
        if ($isOwner && method_exists($contenedor, 'usuarios')) {
            $usersIds = $usersIdsValidadas['userIds'] ?? [];

            $usersToSync = [];
            $creatorId = Auth::id();

            foreach ($usersIds as $userId) {
                if ($userId != $creatorId) {
                    $usersToSync[$userId] = ['propietario' => false];
                }
            }

            if ($creatorId) {
                $usersToSync[$creatorId] = ['propietario' => true];
            }

            $contenedor->usuarios()->sync($usersToSync);
             Log::info('Synced users for contenedor (playlist) ' . $contenedor->id . ': ' . json_encode($usersToSync));
        }

        return Redirect::route('playlists.show', $contenedor->id)
                         ->with('success', 'Playlist actualizada exitosamente.');
    }

    public function destroy($id)
    {
        $contenedor = Contenedor::findOrFail($id);
         if ($contenedor->tipo !== 'playlist') {
            abort(404);
        }
        $this->authorize('delete', $contenedor);

        if (method_exists($contenedor, 'usuarios')) {
             $contenedor->usuarios()->detach();
        }
         if (method_exists($contenedor, 'canciones')) {
             $contenedor->canciones()->detach();
        }

        if ($contenedor->imagen) {
            Storage::disk('public')->delete($contenedor->imagen);
        }

        $contenedor->delete();

        return redirect()->route('playlists.index')
                         ->with('success', 'Playlist eliminada exitosamente.');
    }

    public function anadirCancion(Request $request, Contenedor $contenedor)
    {
        if ($contenedor->tipo !== 'playlist') {
            abort(404);
        }
        $this->authorize('update', $contenedor);

        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        if (method_exists($contenedor, 'canciones')) {
             $contenedor->canciones()->attach($idCancion);
             $message = 'Canción añadida a la playlist.';
        } else {
             Log::error("Relación 'canciones' no encontrada en Contenedor ID: " . $contenedor->id);
             return redirect()->route('playlists.show', $contenedor->id)
                              ->with('error', 'No se pudo añadir la canción.');
        }

        return redirect()->route('playlists.show', $contenedor->id)
                         ->with('success', $message);
    }

    public function quitarCancionPorPivot(Request $request, Contenedor $contenedor, $pivotId)
    {
        if ($contenedor->tipo !== 'playlist') {
            abort(404);
        }
        $this->authorize('update', $contenedor);

        $deleted = false;
        if (method_exists($contenedor, 'canciones')) {
            $deleted = $contenedor->canciones()
                ->wherePivot('id', $pivotId)
                ->detach();
        } else {
             Log::error("Relación 'canciones' no encontrada en Contenedor ID: " . $contenedor->id);
        }

        $message = $deleted ? 'Canción eliminada de la playlist.' : 'Error: No se encontró la instancia de la canción en la playlist.';
        if (!$deleted && method_exists($contenedor, 'canciones')) {
            Log::warning('Intento de eliminar registro pivot no encontrado', ['contenedor_id' => $contenedor->id, 'pivot_id' => $pivotId]);
        }

        return redirect()->route('playlists.show', $contenedor->id)
                         ->with($deleted ? 'success' : 'error', $message);
    }

    public function buscarCanciones(Request $request, Contenedor $contenedor)
    {
         if ($contenedor->tipo !== 'playlist') {
            return response()->json(['error' => 'Tipo de contenedor no válido'], 400);
        }

        $user = Auth::user();
        $consulta = $request->input('query', '');
        $minimoBusqueda = 1;
        $limit = 30;

        $collaboratorIds = [];
        if (method_exists($contenedor, 'usuarios')) {
             $collaboratorIds = $contenedor->usuarios()->pluck('users.id')->toArray();
        }

        $query = Cancion::query()
            ->with('usuarios:id,name')
            ->where(function ($q) use ($user, $collaboratorIds) {
                $q->where('publico', true);
                if ($user) {
                     $q->orWhereHas('usuarios', function ($q2) use ($user) {
                         $q2->where('users.id', $user->id);
                     });
                }
            });

        if (strlen($consulta) >= $minimoBusqueda) {
            $query->where('titulo', 'LIKE', "%{$consulta}%");
            $limit = 15;
        } else {
            $query->orderBy('titulo');
        }

        $resultados = $query
            ->select('canciones.id', 'canciones.titulo', 'canciones.foto_url')
            ->limit($limit)
            ->get();

        return response()->json($resultados);
    }
}
