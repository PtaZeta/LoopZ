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
use Illuminate\Support\Facades\Route;

class ContenedorController extends Controller
{
    private function getTipoVista(Request $peticion): array
    {
        $tipo = null;
        $vistaBase = null;
        $nombreRutaBase = null;

        if ($peticion->routeIs('albumes.*')) {
            $tipo = 'album';
            $vistaBase = 'albumes/';
            $nombreRutaBase = 'albumes';
        } elseif ($peticion->routeIs('playlists.*') || $peticion->routeIs('loopzs.*')) {
            $tipo = 'playlist';
            $vistaBase = 'playlists/';
            $nombreRutaBase = 'playlists';
        } elseif ($peticion->routeIs('eps.*')) {
            $tipo = 'ep';
            $vistaBase = 'eps/';
            $nombreRutaBase = 'eps';
        } elseif ($peticion->routeIs('singles.*')) {
            $tipo = 'single';
            $vistaBase = 'singles/';
            $nombreRutaBase = 'singles';
        } else {
            Log::warning('Acceso a ContenedorController desde ruta no reconocida: ' . $peticion->path());
            abort(404, 'Tipo de recurso no soportado.');
        }

        return ['tipo' => $tipo, 'vista' => $vistaBase, 'ruta' => $nombreRutaBase];
    }
    private function validarTipoContenedor(Contenedor $contenedor, string $tipoEsperado): void
    {
        if ($tipoEsperado === 'playlist' && in_array($contenedor->tipo, ['playlist', 'loopzs'])) {
            return;
        }

        if ($contenedor->tipo !== $tipoEsperado) {
            Log::warning("Discrepancia de tipo al acceder al contenedor.", [
                'id'             => $contenedor->id,
                'actual_type'    => $contenedor->tipo,
                'expected_type'  => $tipoEsperado,
                'route'          => Route::currentRouteName() ?? 'N/A'
            ]);
            abort(404);
        }
    }

    private function getNombreTipo(string $tipo): string
    {
        switch ($tipo) {
            case 'album': return 'álbum';
            case 'playlist': return 'playlist';
            case 'ep': return 'EP';
            case 'single': return 'single';
            default: return 'elemento';
        }
    }


    public function index(Request $peticion)
    {
        $infoRecurso = $this->getTipoVista($peticion);
        $tipoContenedor = $infoRecurso['tipo'];
        $nombreVista = $infoRecurso['vista'] . 'Index';
        $usuario = Auth::user();

        $consultaContenedores = Contenedor::where('tipo', $tipoContenedor)
            ->with(['usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }])
            ->withCount('canciones')
            ->latest();

        if ($usuario) {
             $consultaContenedores->where(function ($query) use ($usuario) {
                 $query->where('publico', true)
                       ->orWhereHas('usuarios', function ($subQuery) use ($usuario) {
                           $subQuery->where('users.id', $usuario->id);
                       });
             });
        } else {
             $consultaContenedores->where('publico', true);
        }
        $contenedores = $consultaContenedores->get();

        $contenedoresConPermisos = $contenedores->map(function ($contenedor) use ($usuario) {
            if ($usuario) {
                $contenedor->can = [
                    'view'   => $usuario->can('view', $contenedor),
                    'edit'   => $usuario->can('update', $contenedor),
                    'delete' => $usuario->can('delete', $contenedor),
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

        return Inertia::render($nombreVista, [
            'contenedores' => $contenedoresConPermisos,
        ]);
    }

    public function create(Request $peticion)
    {
        $infoRecurso = $this->getTipoVista($peticion);
        $nombreVista = $infoRecurso['vista'] . 'Create';
        return Inertia::render($nombreVista, ['tipo' => $infoRecurso['tipo']]);
    }

    public function store(StoreContenedorRequest $peticion)
    {
        $infoRecurso = $this->getTipoVista($peticion);
        $tipoContenedor = $infoRecurso['tipo'];
        $rutaRedireccion = $infoRecurso['ruta'] . '.index';

        $datosValidados = $peticion->validated();
        $datosValidados['tipo'] = $tipoContenedor;

        if ($peticion->hasFile('imagen')) {
            $ruta = $peticion->file('imagen')->store('contenedor_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $peticion->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $contenedor = Contenedor::create($datosValidados);

        if (method_exists($contenedor, 'usuarios')) {
            $idsUsuariosEntrada = $peticion->input('userIds', []);
            $idCreador = Auth::id();
            $usuariosASincronizar = [];

            foreach ($idsUsuariosEntrada as $idUsuario) {
                if ($idUsuario != $idCreador) {
                    $usuariosASincronizar[$idUsuario] = ['propietario' => false];
                }
            }
            if ($idCreador) {
                $usuariosASincronizar[$idCreador] = ['propietario' => true];
            }

            if (!empty($usuariosASincronizar)) {
                $contenedor->usuarios()->attach($usuariosASincronizar);
                Log::info('Usuarios adjuntados al contenedor (' . $tipoContenedor . ') ' . $contenedor->id . ': ' . json_encode($usuariosASincronizar));
            }
        } else {
             Log::warning('El método usuarios() no existe en el modelo Contenedor para el ID ' . $contenedor->id);
        }

        $mensaje = ucfirst($this->getNombreTipo($tipoContenedor)) . ' creado exitosamente.';
        return redirect()->route($rutaRedireccion)->with('success', $mensaje);
    }

    public function show(Request $peticion, $id)
    {
        $infoRecurso = $this->getTipoVista($peticion);
        $tipoEsperado = $infoRecurso['tipo'];
        $nombreVista = $infoRecurso['vista'] . 'Show';

        $contenedor = Contenedor::findOrFail($id);
        $this->validarTipoContenedor($contenedor, $tipoEsperado);

        $usuario = Auth::user();

        $contenedor->load([
            'canciones' => function ($query) use ($usuario) { // Pasar $usuario al closure
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id')
                      ->when($usuario, function ($q) use ($usuario) {
                          $q->withExists(['loopzUsuarios as is_loopz_by_user' => function ($subQuery) use ($usuario) {
                              $subQuery->where('user_id', $usuario->id);
                          }]);
                      });
            },
            'usuarios:id,name',
            'loopzusuarios:users.id'
        ]);

         if ($usuario) {
             $contenedor->can = [
                 'view'   => $usuario->can('view', $contenedor),
                 'edit'   => $usuario->can('update', $contenedor),
                 'delete' => $usuario->can('delete', $contenedor),
             ];
             $contenedor->is_liked_by_user = $contenedor->loopzusuarios->contains('id', $usuario->id);

             if (!isset($contenedor->canciones[0]->is_loopz_by_user)) {
                foreach ($contenedor->canciones as $cancion) {
                    $cancion->is_loopz_by_user = false;
                }
             }

         } else {
             $contenedor->is_liked_by_user = false;
             foreach ($contenedor->canciones ?? [] as $cancion) {
                $cancion->is_loopz_by_user = false;
            }
         }


        return Inertia::render($nombreVista, [
            'contenedor' => $contenedor,
        ]);
    }

    public function edit(Request $peticion, $id)
    {
        $infoRecurso = $this->getTipoVista($peticion);
        $tipoEsperado = $infoRecurso['tipo'];
        $nombreVista = $infoRecurso['vista'] . 'Edit';

        $contenedor = Contenedor::findOrFail($id);
        $this->validarTipoContenedor($contenedor, $tipoEsperado);
        $this->authorize('update', $contenedor);

        $contenedor->load(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name', 'users.email')->withPivot('propietario');
        }]);

        $esPropietario = false;
        if (Auth::check() && method_exists($contenedor, 'usuarios')) {
            $propietario = $contenedor->usuarios()->wherePivot('propietario', true)->first();
            $esPropietario = $propietario && $propietario->id === Auth::id();
        }
        $contenedor->is_owner = $esPropietario;

        return Inertia::render($nombreVista, [
            'contenedor' => $contenedor,
        ]);
    }

    public function update(UpdateContenedorRequest $peticion, $id)
    {
        $infoRecurso = $this->getTipoVista($peticion);
        $tipoEsperado = $infoRecurso['tipo'];
        $rutaBase = $infoRecurso['ruta'];
        $rutaRedireccion = $rutaBase . '.show';

        $contenedor = Contenedor::findOrFail($id);
        $this->validarTipoContenedor($contenedor, $tipoEsperado);
        $this->authorize('update', $contenedor);

        $datosValidados = $peticion->validated();

        $esPropietario = false;
        if (Auth::check() && method_exists($contenedor, 'usuarios')) {
            $propietario = $contenedor->usuarios()->wherePivot('propietario', true)->first();
            $esPropietario = $propietario && $propietario->id === Auth::id();
        }

        $idsUsuariosValidados = [];
        if ($esPropietario) {
             $idsUsuariosValidados = $peticion->validate([
                 'userIds' => 'nullable|array',
                 'userIds.*' => 'integer|exists:users,id',
             ]);
        } else {
             unset($datosValidados['userIds']);
        }

        $eliminarImagen = $peticion->boolean('eliminar_imagen');
        $carpetaDestino = 'contenedor_images';
        $rutaImagenAntigua = $contenedor->imagen;

        if ($peticion->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $peticion->file('imagen_nueva');
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

        if ($esPropietario && method_exists($contenedor, 'usuarios')) {
            $idsUsuarios = $idsUsuariosValidados['userIds'] ?? [];
            $usuariosASincronizar = [];
            $idCreador = Auth::id();

            if ($idCreador) {
                 $usuariosASincronizar[$idCreador] = ['propietario' => true];
            }

            foreach ($idsUsuarios as $idUsuario) {
                if ($idUsuario != $idCreador) {
                    $usuariosASincronizar[$idUsuario] = ['propietario' => false];
                }
            }

            $contenedor->usuarios()->sync($usuariosASincronizar);
            Log::info('Usuarios sincronizados para el contenedor (' . $tipoEsperado . ') ' . $contenedor->id . ': ' . json_encode($usuariosASincronizar));
        }

        $mensaje = ucfirst($this->getNombreTipo($tipoEsperado)) . ' actualizado exitosamente.';
        return Redirect::route($rutaRedireccion, $contenedor->id)->with('success', $mensaje);
    }

    public function destroy(Request $peticion, $id)
    {
        $infoRecurso = $this->getTipoVista($peticion);
        $tipoEsperado = $infoRecurso['tipo'];
        $rutaRedireccion = $infoRecurso['ruta'] . '.index';

        $contenedor = Contenedor::findOrFail($id);
        $this->validarTipoContenedor($contenedor, $tipoEsperado);
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

        $mensaje = ucfirst($this->getNombreTipo($tipoEsperado)) . ' eliminado exitosamente.';
        return redirect()->route($rutaRedireccion)->with('success', $mensaje);
    }

    public function buscarCanciones(Request $peticion, Contenedor $contenedor)
    {
        if (!in_array($contenedor->tipo, ['playlist', 'album', 'ep', 'single', 'loopzs'])) {
             return response()->json(['error' => 'Tipo de contenedor no válido para buscar canciones'], 400);
        }

        $usuario = Auth::user();
        $consulta = $peticion->input('query', '');
        $minimoBusqueda = 1;
        $limite = 30;

        $idsColaboradores = [];
        if (method_exists($contenedor, 'usuarios')) {
             $idsColaboradores = $contenedor->usuarios()->pluck('users.id')->toArray();
        }

        $idsCancionesExistentes = [];
        if (in_array($contenedor->tipo, ['album', 'ep', 'single']) && method_exists($contenedor, 'canciones')) {
            $idsCancionesExistentes = $contenedor->canciones()->pluck('canciones.id')->all();
        }

        $consultaCanciones = Cancion::query()
            ->with('usuarios:id,name')
            ->where(function ($q) use ($usuario, $idsColaboradores) {
                $q->where('publico', true);
                if ($usuario) {
                     $q->orWhereHas('usuarios', function ($q2) use ($usuario) {
                         $q2->where('users.id', $usuario->id);
                     });
                }
            });

        if (in_array($contenedor->tipo, ['album', 'ep', 'single']) && !empty($idsCancionesExistentes)) {
            $consultaCanciones->whereNotIn('canciones.id', $idsCancionesExistentes);
        }

        if (strlen($consulta) >= $minimoBusqueda) {
            $consultaCanciones->where('titulo', 'LIKE', "%{$consulta}%");
            $limite = 15;
        } else {
             $consultaCanciones->orderBy('titulo');
        }

        $resultados = $consultaCanciones
            ->select('canciones.id', 'canciones.titulo', 'canciones.foto_url')
            ->limit($limite)
            ->get();

        return response()->json($resultados);
    }

    public function anadirCancion(Request $peticion, Contenedor $contenedor)
    {
        if (!in_array($contenedor->tipo, ['playlist', 'album', 'ep', 'single'])) { abort(404); }
        $this->authorize('update', $contenedor);

        $valido = $peticion->validate([
             'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];
        $mensaje = 'Error interno.';
        $tipoNombre = $this->getNombreTipo($contenedor->tipo);


        if (method_exists($contenedor, 'canciones')) {
             if (in_array($contenedor->tipo, ['album', 'ep', 'single'])) {
                  $yaExiste = $contenedor->canciones()->where('canciones.id', $idCancion)->exists();
                  if ($yaExiste) {
                      $mensaje = 'Esta canción ya está en el ' . $tipoNombre . '.';
                  } else {
                      $contenedor->canciones()->attach($idCancion);
                      $mensaje = 'Canción añadida al ' . $tipoNombre . '.';
                  }
             } else {
                  $contenedor->canciones()->attach($idCancion);
                  $mensaje = 'Canción añadida a la ' . $tipoNombre . '.';
             }
        } else {
             Log::error("Relación 'canciones' no encontrada en Contenedor ID: " . $contenedor->id);
             $mensaje = 'No se pudo añadir la canción.';
        }

        $rutaBase = match ($contenedor->tipo) {
             'album' => 'albumes',
             'ep' => 'eps',
             'single' => 'singles',
             default => 'playlists'
        };
        $rutaRedireccion = $rutaBase . '.show';

        $tipoMensaje = 'success';
        if (str_contains($mensaje, 'Error') || str_contains($mensaje, 'ya está')) {
             $tipoMensaje = 'error';
        }

        return redirect()->route($rutaRedireccion, $contenedor->id)
                         ->with($tipoMensaje, $mensaje);
    }

    public function quitarCancionPorPivot(Request $peticion, Contenedor $contenedor, $idPivot)
    {
        if (!in_array($contenedor->tipo, ['playlist', 'album', 'ep', 'single'])) { abort(404); }
        $this->authorize('update', $contenedor);

        $eliminado = false;
        if (method_exists($contenedor, 'canciones')) {
             $eliminado = $contenedor->canciones()
                 ->wherePivot('id', $idPivot)
                 ->detach();
        } else {
             Log::error("Relación 'canciones' no encontrada en Contenedor ID: " . $contenedor->id);
        }

        $tipoNombre = $this->getNombreTipo($contenedor->tipo);
        $mensaje = $eliminado
             ? 'Canción eliminada de ' . ($contenedor->tipo === 'playlist' ? 'la ' : 'el ') . $tipoNombre . '.'
             : 'Error: No se encontró la instancia de la canción.';


        if (!$eliminado && method_exists($contenedor, 'canciones')) {
             Log::warning('Intento de eliminar registro pivot no encontrado', ['contenedor_id' => $contenedor->id, 'pivot_id' => $idPivot]);
        }

        $rutaBase = match ($contenedor->tipo) {
             'album' => 'albumes',
             'ep' => 'eps',
             'single' => 'singles',
             default => 'playlists'
        };
        $rutaRedireccion = $rutaBase . '.show';

        return redirect()->route($rutaRedireccion, $contenedor->id)
                         ->with($eliminado ? 'success' : 'error', $mensaje);
    }

    public function toggleLoopz(Request $request, Contenedor $contenedor)
    {
        $user = Auth::user();

        if (!$user) {
            return Redirect::back()->with('error', 'Debes iniciar sesión para marcar como LoopZ.');
        }

        $isLiked = $contenedor->loopzusuarios()->where('user_id', $user->id)->exists();
        $tipoNombre = $this->getNombreTipo($contenedor->tipo);

        if ($isLiked) {
            $contenedor->loopzusuarios()->detach($user->id);
            $mensaje = ucfirst($tipoNombre) . ' desmarcado como LoopZ.';
            Log::info("Usuario {$user->id} desmarcó como LoopZ el {$tipoNombre} ID: {$contenedor->id}");
        } else {
            $contenedor->loopzusuarios()->attach($user->id);
            $mensaje = ucfirst($tipoNombre) . ' marcado como LoopZ.';
            Log::info("Usuario {$user->id} marcó como LoopZ el {$tipoNombre} ID: {$contenedor->id}");
        }

        return Redirect::back()->with('success', $mensaje);
    }
}
