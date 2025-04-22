<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAlbumRequest;
use App\Http\Requests\UpdateAlbumRequest;
use App\Models\Album;
use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class AlbumController extends Controller
{
    public function index()
    {
        $usuario = Auth::user();
        $consultaAlbumes = Album::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest();

        if ($usuario) {
            $consultaAlbumes->where('publico', true)
                            ->orWhereHas('usuarios', function ($query) use ($usuario) {
                                $query->where('users.id', $usuario->id);
                            });
        } else {
            $consultaAlbumes->where('publico', true);
        }

        $albumes = $consultaAlbumes->get();

        $albumesConPermisos = $albumes->map(function ($album) use ($usuario) {
            if ($usuario) {
                $album->can = [
                    'view'   => $usuario->can('view', $album),
                    'edit'   => $usuario->can('update', $album),
                    'delete' => $usuario->can('delete', $album),
                ];
            } else {
                $album->can = [
                    'view'   => $album->publico,
                    'edit'   => false,
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
        return Inertia::render('albumes/Create');
    }

    public function store(StoreAlbumRequest $request)
    {
        $datosValidados = $request->validated();

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);


        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('album_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $album = Album::create($datosValidados);

        if (method_exists($album, 'usuarios')) {
            $idsUsuarios = $request->input('userIds', []);
            $idCreador = Auth::id();
            if ($idCreador && !in_array($idCreador, $idsUsuarios)) {
                $idsUsuarios[] = $idCreador;
            }
            if (!empty($idsUsuarios)) {
                $album->usuarios()->attach(array_unique($idsUsuarios));
            }
        }

        return redirect()->route('albumes.index')->with('success', 'Álbum creado exitosamente.');
    }

    public function show($id)
    {
        $usuario = Auth::user();
        $album = Album::with([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id');
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }
        ])->findOrFail($id);

        if ($usuario) {
             $album->can = [
                'view'   => true,
                'edit'   => $usuario->can('update', $album),
                'delete' => $usuario->can('delete', $album),
            ];
        } else {
             if (!$album->publico) {
                 abort(403);
             }
            $album->can = [
                'view'   => true,
                'edit'   => false,
                'delete' => false,
            ];
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

        return Inertia::render('albumes/Edit', [
            'album' => $album,
        ]);
    }

    public function update(UpdateAlbumRequest $request, $id)
    {
        $album = Album::findOrFail($id);
        $this->authorize('update', $album);

        $datosValidados = $request->validated();

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

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
            $idsUsuarios = $request->input('userIds', []);
            $idCreador = Auth::id();
             if ($idCreador && !in_array($idCreador, $idsUsuarios)) {
                 $idsUsuarios[] = $idCreador;
             }
            $album->usuarios()->sync(array_unique($idsUsuarios));
        }

        return Redirect::route('albumes.show', $album->id)
                        ->with('success', 'Álbum actualizado exitosamente.');
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

        return redirect()->route('albumes.index')->with('success', 'Álbum eliminado exitosamente.');
    }

    public function anadirCancion(Request $request, Album $album)
    {
        $this->authorize('update', $album);
        $validacionCancion = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $validacionCancion['cancion_id'];

        $mensaje = 'Esta canción ya está en el álbum.';
        if (!$album->canciones()->where('canciones.id', $idCancion)->exists()) {
            $album->canciones()->attach($idCancion);
            $mensaje = 'Canción añadida al álbum.';
        }

        return redirect()->back()->with('success', $mensaje);
    }

    public function quitarCancionPorPivot(Request $request, Album $album, $pivotId)
    {
        $this->authorize('update', $album);

        $eliminado = $album->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $mensaje = $eliminado ? 'Canción eliminada del álbum.' : 'Error al eliminar la canción.';

        return redirect()->back()->with($eliminado ? 'success' : 'error', $mensaje);
    }

    public function buscarCanciones(Request $request, Album $album)
    {
        $this->authorize('update', $album);

        $terminoBusquedaCancion = $request->input('query', '');
        $longitudMinimaBusquedaCancion = 1;
        $limite = 30;

        $idsCancionesEnAlbum = $album->canciones()->pluck('canciones.id')->toArray();

        $idsColaboradores = $album->usuarios()->pluck('users.id')->toArray();

        $consultaCanciones = Cancion::query()
             ->with('usuarios:id,name')
             ->whereNotIn('canciones.id', $idsCancionesEnAlbum)
             ->where(function ($q) use ($idsColaboradores) {
                 $q->where('publico', true)
                   ->orWhereHas('usuarios', function ($q2) use ($idsColaboradores) {
                       $q2->whereIn('users.id', $idsColaboradores);
                   });
             });

        if (strlen($terminoBusquedaCancion) >= $longitudMinimaBusquedaCancion) {
            $consultaCanciones->where('titulo', 'LIKE', "%{$terminoBusquedaCancion}%");
            $limite = 15;
        } else {
            $consultaCanciones->orderBy('titulo');
        }

        $resultados = $consultaCanciones->select('id', 'titulo', 'foto_url')
                              ->limit($limite)
                              ->get();

        return response()->json($resultados);
    }
}
