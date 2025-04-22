<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSingleRequest;
use App\Http\Requests\UpdateSingleRequest;
use App\Models\Single;
use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class SingleController extends Controller
{
    public function index()
    {
        $usuario = Auth::user();
        $consultaSingles = Single::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest();

        if ($usuario) {
            $consultaSingles->where('publico', true)
                            ->orWhereHas('usuarios', function ($query) use ($usuario) {
                                $query->where('users.id', $usuario->id);
                            });
        } else {
            $consultaSingles->where('publico', true);
        }

        $singles = $consultaSingles->get();

        $singlesConPermisos = $singles->map(function ($single) use ($usuario) {
            if ($usuario) {
                $single->can = [
                    'view'   => $usuario->can('view', $single),
                    'edit'   => $usuario->can('update', $single),
                    'delete' => $usuario->can('delete', $single),
                ];
            } else {
                $single->can = [
                    'view'   => $single->publico,
                    'edit'   => false,
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
        return Inertia::render('singles/Create');
    }

    public function store(StoreSingleRequest $request)
    {
        $datosValidados = $request->validated();

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);


        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('single_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $single = Single::create($datosValidados);

        if (method_exists($single, 'usuarios')) {
            $idsUsuarios = $request->input('userIds', []);
            $idCreador = Auth::id();
            if ($idCreador && !in_array($idCreador, $idsUsuarios)) {
                $idsUsuarios[] = $idCreador;
            }
            if (!empty($idsUsuarios)) {
                $single->usuarios()->attach(array_unique($idsUsuarios));
            }
        }

        return redirect()->route('singles.index')->with('success', 'Álbum creado exitosamente.');
    }

    public function show($id)
    {
        $usuario = Auth::user();
        $single = Single::with([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id');
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }
        ])->findOrFail($id);

        if ($usuario) {
             $single->can = [
                'view'   => true,
                'edit'   => $usuario->can('update', $single),
                'delete' => $usuario->can('delete', $single),
            ];
        } else {
             if (!$single->publico) {
                 abort(403);
             }
            $single->can = [
                'view'   => true,
                'edit'   => false,
                'delete' => false,
            ];
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

        return Inertia::render('singles/Edit', [
            'single' => $single,
        ]);
    }

    public function update(UpdateSingleRequest $request, $id)
    {
        $single = Single::findOrFail($id);
        $this->authorize('update', $single);

        $datosValidados = $request->validated();

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

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
            $idsUsuarios = $request->input('userIds', []);
            $idCreador = Auth::id();
             if ($idCreador && !in_array($idCreador, $idsUsuarios)) {
                 $idsUsuarios[] = $idCreador;
             }
            $single->usuarios()->sync(array_unique($idsUsuarios));
        }

        return Redirect::route('singles.show', $single->id)
                        ->with('success', 'Álbum actualizado exitosamente.');
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

        return redirect()->route('singles.index')->with('success', 'Álbum eliminado exitosamente.');
    }

    public function anadirCancion(Request $request, Single $single)
    {
        $this->authorize('update', $single);
        $validacionCancion = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $validacionCancion['cancion_id'];

        $mensaje = 'Esta canción ya está en el álbum.';
        if (!$single->canciones()->where('canciones.id', $idCancion)->exists()) {
            $single->canciones()->attach($idCancion);
            $mensaje = 'Canción añadida al álbum.';
        }

        return redirect()->back()->with('success', $mensaje);
    }

    public function quitarCancionPorPivot(Request $request, Single $single, $pivotId)
    {
        $this->authorize('update', $single);

        $eliminado = $single->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $mensaje = $eliminado ? 'Canción eliminada del álbum.' : 'Error al eliminar la canción.';

        return redirect()->back()->with($eliminado ? 'success' : 'error', $mensaje);
    }

    public function buscarCanciones(Request $request, Single $single)
    {
        $this->authorize('update', $single);

        $terminoBusquedaCancion = $request->input('query', '');
        $longitudMinimaBusquedaCancion = 1;
        $limite = 30;

        $idsCancionesEnSingle = $single->canciones()->pluck('canciones.id')->toArray();

        $idsColaboradores = $single->usuarios()->pluck('users.id')->toArray();

        $consultaCanciones = Cancion::query()
             ->with('usuarios:id,name')
             ->whereNotIn('canciones.id', $idsCancionesEnSingle)
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
