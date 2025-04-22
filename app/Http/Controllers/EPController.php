<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEPRequest;
use App\Http\Requests\UpdateEPRequest;
use App\Models\EP;
use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class EPController extends Controller
{
    public function index()
    {
        $usuario = Auth::user();
        $consultaEPs = EP::with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name');
        }])->withCount('canciones')->latest();

        if ($usuario) {
            $consultaEPs->where('publico', true)
                            ->orWhereHas('usuarios', function ($query) use ($usuario) {
                                $query->where('users.id', $usuario->id);
                            });
        } else {
            $consultaEPs->where('publico', true);
        }

        $eps = $consultaEPs->get();

        $epsConPermisos = $eps->map(function ($ep) use ($usuario) {
            if ($usuario) {
                $ep->can = [
                    'view'   => $usuario->can('view', $ep),
                    'edit'   => $usuario->can('update', $ep),
                    'delete' => $usuario->can('delete', $ep),
                ];
            } else {
                $ep->can = [
                    'view'   => $ep->publico,
                    'edit'   => false,
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
        return Inertia::render('eps/Create');
    }

    public function store(StoreEPRequest $request)
    {
        $datosValidados = $request->validated();

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);


        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('ep_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
            unset($datosValidados['imagen']);
        }

        $ep = EP::create($datosValidados);

        if (method_exists($ep, 'usuarios')) {
            $idsUsuarios = $request->input('userIds', []);
            $idCreador = Auth::id();
            if ($idCreador && !in_array($idCreador, $idsUsuarios)) {
                $idsUsuarios[] = $idCreador;
            }
            if (!empty($idsUsuarios)) {
                $ep->usuarios()->attach(array_unique($idsUsuarios));
            }
        }

        return redirect()->route('eps.index')->with('success', 'Álbum creado exitosamente.');
    }

    public function show($id)
    {
        $usuario = Auth::user();
        $ep = EP::with([
            'canciones' => function ($query) {
                $query->select('canciones.id', 'canciones.titulo', 'canciones.archivo_url', 'canciones.foto_url', 'canciones.duracion')
                      ->withPivot('id as pivot_id');
            },
            'usuarios' => function ($query) {
                $query->select('users.id', 'users.name');
            }
        ])->findOrFail($id);

        if ($usuario) {
             $ep->can = [
                'view'   => true,
                'edit'   => $usuario->can('update', $ep),
                'delete' => $usuario->can('delete', $ep),
            ];
        } else {
             if (!$ep->publico) {
                 abort(403);
             }
            $ep->can = [
                'view'   => true,
                'edit'   => false,
                'delete' => false,
            ];
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

        return Inertia::render('eps/Edit', [
            'ep' => $ep,
        ]);
    }

    public function update(UpdateEPRequest $request, $id)
    {
        $ep = EP::findOrFail($id);
        $this->authorize('update', $ep);

        $datosValidados = $request->validated();

        $request->validate([
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

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
            $idsUsuarios = $request->input('userIds', []);
            $idCreador = Auth::id();
             if ($idCreador && !in_array($idCreador, $idsUsuarios)) {
                 $idsUsuarios[] = $idCreador;
             }
            $ep->usuarios()->sync(array_unique($idsUsuarios));
        }

        return Redirect::route('eps.show', $ep->id)
                        ->with('success', 'Álbum actualizado exitosamente.');
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

        return redirect()->route('eps.index')->with('success', 'Álbum eliminado exitosamente.');
    }

    public function anadirCancion(Request $request, EP $ep)
    {
        $this->authorize('update', $ep);
        $validacionCancion = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $validacionCancion['cancion_id'];

        $mensaje = 'Esta canción ya está en el álbum.';
        if (!$ep->canciones()->where('canciones.id', $idCancion)->exists()) {
            $ep->canciones()->attach($idCancion);
            $mensaje = 'Canción añadida al álbum.';
        }

        return redirect()->back()->with('success', $mensaje);
    }

    public function quitarCancionPorPivot(Request $request, EP $ep, $pivotId)
    {
        $this->authorize('update', $ep);

        $eliminado = $ep->canciones()
            ->wherePivot('id', $pivotId)
            ->detach();

        $mensaje = $eliminado ? 'Canción eliminada del álbum.' : 'Error al eliminar la canción.';

        return redirect()->back()->with($eliminado ? 'success' : 'error', $mensaje);
    }

    public function buscarCanciones(Request $request, EP $ep)
    {
        $this->authorize('update', $ep);

        $terminoBusquedaCancion = $request->input('query', '');
        $longitudMinimaBusquedaCancion = 1;
        $limite = 30;

        $idsCancionesEnEP = $ep->canciones()->pluck('canciones.id')->toArray();

        $idsColaboradores = $ep->usuarios()->pluck('users.id')->toArray();

        $consultaCanciones = Cancion::query()
             ->with('usuarios:id,name')
             ->whereNotIn('canciones.id', $idsCancionesEnEP)
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
