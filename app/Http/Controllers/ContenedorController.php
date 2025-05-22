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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        } elseif ($peticion->routeIs('playlists.*')) {
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
        } elseif ($peticion->routeIs('loopzs.*')) {
            $tipo = 'loopz';
            $vistaBase = 'loopzs/';
            $nombreRutaBase = 'loopzs';
        }
        return ['tipo' => $tipo, 'vista' => $vistaBase, 'ruta' => $nombreRutaBase];
    }

    private function validarTipoContenedor(Contenedor $contenedor, string $tipoEsperado): void
    {
        if ($contenedor->tipo !== $tipoEsperado) {
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
        }
    }

    private function getLoopZUsuario($user): array
    {
        if (!$user) {
            return [];
        }
        $loopzPlaylist = $user->perteneceContenedores()
                                ->where('tipo', 'loopz')
                                ->first();

        if (!$loopzPlaylist) {
            return [];
        }

        return DB::table('cancion_contenedor')
               ->where('contenedor_id', $loopzPlaylist->id)
               ->pluck('cancion_id')
               ->all();
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

            $contenedor->genero = $contenedor->generoPredominante();

            return $contenedor;
        });

        return Inertia::render($nombreVista, [
            'contenedores' => $contenedoresConPermisos,
        ]);
    }


    public function crearLanzamiento()
    {
        return Inertia::render('lanzamiento/Create');
    }
    public function storeLanzamiento(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:1000',
            'tipo' => 'required|in:album,ep,single',
            'imagen' => 'nullable|image|max:4096',
            'publico' => 'boolean',
            'tipo' => 'required|in:album,ep,single',
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $imagenUrl = null;
        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            $archivoImagen = $request->file('imagen');
            $imagenUrl = Storage::disk('s3')->url(
                Storage::disk('s3')->putFileAs(
                    'contenedor_imagenes',
                    $archivoImagen,
                    Str::uuid() . "_img.{$archivoImagen->getClientOriginalExtension()}",
                )
            );
        }

        $contenedor = Contenedor::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'tipo' => $validated['tipo'],
            'imagen' => $imagenUrl,
            'tipo' => $validated['tipo'],
            'publico' => $validated['publico'] ?? false,
        ]);

        if (method_exists($contenedor, 'usuarios')) {
            $idCreador = Auth::id();
            $usuariosASincronizar = [];

            foreach ($validated['userIds'] ?? [] as $idUsuario) {
                if ($idUsuario != $idCreador) {
                    $usuariosASincronizar[(int) $idUsuario] = ['propietario' => false];
                }
            }
            if ($idCreador) {
                $usuariosASincronizar[$idCreador] = ['propietario' => true];
            }

            if (!empty($usuariosASincronizar)) {
                $contenedor->usuarios()->attach($usuariosASincronizar);
            }
        }

        return redirect()->route('biblioteca')->with('success', 'Lanzamiento creado exitosamente.');
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

        $datosValidados = $peticion->validated();
        $datosValidados['tipo'] = $tipoContenedor;

        $campoImagen = 'imagen';

        if ($peticion->hasFile($campoImagen) && $peticion->file($campoImagen)->isValid()) {
            $archivoImagen = $peticion->file($campoImagen);

            $datosValidados[$campoImagen] = Storage::disk('s3')->url(
                Storage::disk('s3')->putFileAs(
                    'contenedor_imagenes',
                    $archivoImagen,
                    Str::uuid() . "_img.{$archivoImagen->getClientOriginalExtension()}",
                )
            );

        } else {
             if (isset($datosValidados[$campoImagen])) {
                 unset($datosValidados[$campoImagen]);
             }
        }

        $contenedor = Contenedor::create($datosValidados);

        if (method_exists($contenedor, 'usuarios')) {
            $idCreador = Auth::id();
            $usuariosASincronizar = [];

            foreach ($peticion->input('userIds', []) as $idUsuario) {
                if ($idUsuario != $idCreador) {
                    $usuariosASincronizar[(int) $idUsuario] = ['propietario' => false];
                }
            }
            if ($idCreador) {
                $usuariosASincronizar[$idCreador] = ['propietario' => true];
            }

            if (!empty($usuariosASincronizar)) {
                $contenedor->usuarios()->attach($usuariosASincronizar);
            }
        }

        return redirect()->route('biblioteca');
    }


public function show(Request $peticion, $id)
{
    $infoRecurso = $this->getTipoVista($peticion);
    $tipoEsperado = $infoRecurso['tipo'];
    $nombreVista = $infoRecurso['vista'] . 'Show';

    $contenedor = Contenedor::findOrFail($id);

    if ($contenedor->imagen && !filter_var($contenedor->imagen, FILTER_VALIDATE_URL)) {
        $contenedor->imagen = Storage::disk('s3')->url($contenedor->imagen);
    }

    $this->validarTipoContenedor($contenedor, $tipoEsperado);

    $usuario = Auth::user();
    $loopzSongIds = $this->getLoopZUsuario($usuario);

    $contenedor->load([
        'canciones' => function ($query) {
            $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                ->withPivot('id as pivot_id', 'created_at as pivot_created_at')
                ->with(['usuarios' => function ($userQuery) {
                    $userQuery->select('users.id', 'users.name');
                }])
                ->orderBy('pivot_created_at');
        },
        'usuarios:id,name',
        'loopzusuarios:users.id'
    ]);

    $contenedor->canciones->each(function ($cancion) use ($loopzSongIds) {
        $cancion->is_in_user_loopz = in_array($cancion->id, $loopzSongIds);
    });

    if ($usuario) {
        $contenedor->can = [
            'view'   => $usuario->can('view', $contenedor),
            'edit'   => $usuario->can('update', $contenedor),
            'delete' => $usuario->can('delete', $contenedor),
        ];
        $contenedor->is_liked_by_user = $contenedor->loopzusuarios->contains('id', $usuario->id);

        $userPlaylists = $usuario->perteneceContenedores()
            ->where('tipo', 'playlist')
            ->with('canciones:id')
            ->select('id', 'nombre', 'imagen')
            ->get();

        $userPlaylists->each(function ($playlist) {
            if ($playlist->imagen && !filter_var($playlist->imagen, FILTER_VALIDATE_URL)) {
                $playlist->imagen = Storage::disk('s3')->url($playlist->imagen);
            }
        });
    } else {
        $contenedor->can = [
            'view'   => $contenedor->publico ?? false,
            'edit'   => false,
            'delete' => false,
        ];
        $contenedor->is_liked_by_user = false;
        $userPlaylists = collect();
    }

    return Inertia::render($nombreVista, [
        'contenedor' => $contenedor,
        'auth' => [
            'user' => $usuario ? [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'playlists' => $userPlaylists->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'nombre' => $p->nombre,
                        'imagen' => $p->imagen,
                        'canciones' => $p->canciones,
                    ];
                }),
            ] : null,
        ],
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

        if ($esPropietario) {
            $idsUsuariosValidados = $peticion->validate([
                'userIds' => 'nullable|array',
                'userIds.*' => 'integer|exists:users,id',
            ]);
        } else {
            unset($datosValidados['userIds']);
        }

        $campoImagenRequest = 'imagen_nueva';
        $campoImagenModelo = 'imagen';
        $directorioS3 = 'contenedor_imagenes';

        $rutaImagenAntigua = $contenedor->$campoImagenModelo;

        if ($peticion->hasFile($campoImagenRequest) && $peticion->file($campoImagenRequest)->isValid()) {
            if ($rutaImagenAntigua) {
                if (Storage::disk('s3')->exists($rutaImagenAntigua)) {
                    Storage::disk('s3')->delete($rutaImagenAntigua);
                }
            }

            $nuevoArchivoImagen = $peticion->file($campoImagenRequest);
            $nombreArchivo = Str::uuid() . "_img." . $nuevoArchivoImagen->getClientOriginalExtension();
            $pathGuardadoS3 = Storage::disk('s3')->putFileAs(
                $directorioS3,
                $nuevoArchivoImagen,
                $nombreArchivo,
                'public-read'
            );

            $urlCompleta = Storage::disk('s3')->url($pathGuardadoS3);
            $datosValidados[$campoImagenModelo] = $urlCompleta;

        } elseif ($peticion->boolean('eliminar_imagen')) {
            if ($rutaImagenAntigua) {
                if (Storage::disk('s3')->exists($rutaImagenAntigua)) {
                    Storage::disk('s3')->delete($rutaImagenAntigua);
                }
            }
            $datosValidados[$campoImagenModelo] = null;

        } else {
            unset($datosValidados[$campoImagenModelo]);
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
        }

        return redirect()->route($rutaRedireccion, $contenedor->id)->with('success', ucfirst($this->getNombreTipo($tipoEsperado)) . ' actualizado exitosamente.');
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
        if (!in_array($contenedor->tipo, ['playlist', 'album', 'ep', 'single', 'loopz'])) {
             return response()->json(['error' => 'Tipo de contenedor no válido para buscar canciones'], 400);
        }

        $usuario = Auth::user();
        $loopzSongIds = $this->getLoopZUsuario($usuario);
        $consulta = $peticion->input('query', '');
        $minimoBusqueda = 1;
        $limite = 30;


        $idsCancionesExistentes = [];
         if (in_array($contenedor->tipo, ['album', 'ep', 'single']) && method_exists($contenedor, 'canciones')) {
             $idsCancionesExistentes = $contenedor->canciones()->pluck('canciones.id')->all();
         }

        $consultaCanciones = Cancion::query()
            ->with('usuarios:id,name')
            ->where(function ($q) use ($usuario) {
                 $q->where('publico', true);
                 if ($usuario) {
                     $q->orWhereHas('usuarios', function ($q2) use ($usuario) {
                         $q2->where('users.id', $usuario->id);
                     });
                 }
            });

        if (!empty($idsCancionesExistentes)) {
            $consultaCanciones->whereNotIn('canciones.id', $idsCancionesExistentes);
        }

        if (strlen($consulta) >= $minimoBusqueda) {
            $consultaCanciones->where('titulo', 'LIKE', "%{$consulta}%");
            $limite = 15;
        } else {
             $consultaCanciones->orderBy('titulo');
        }

        $resultados = $consultaCanciones
            ->select('canciones.id', 'canciones.titulo', 'canciones.foto_url', 'canciones.duracion')
            ->limit($limite)
            ->get();

        $resultados->each(function ($cancion) use ($loopzSongIds) {
            $cancion->is_in_user_loopz = in_array($cancion->id, $loopzSongIds);
        });

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

    public function toggleCancion(Request $request, $playlistId, $songId)
    {
        $user = $request->user();

        $playlist = Contenedor::where('id', $playlistId)
            ->where('tipo', 'playlist')
            ->whereHas('usuarios', fn($q) => $q->where('users.id', $user->id))
            ->firstOrFail();

        $cancion = Cancion::findOrFail($songId);

        if ($playlist->canciones()->where('cancion_id', $cancion->id)->exists()) {
            $playlist->canciones()->detach($cancion);
        } else {
            $playlist->canciones()->attach($cancion);
        }

        return back();
    }
}
