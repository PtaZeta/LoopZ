<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlaylistRequest;
use App\Http\Requests\UpdatePlaylistRequest;
use App\Models\Playlist;
use App\Models\Cancion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema; // Importar Schema
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PlaylistController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        // Cargar playlists con el recuento de canciones para eficiencia si se muestra en el índice
        $listasReproduccion = Playlist::withCount('canciones')->get();

        $listasConPermisos = $listasReproduccion->map(function ($playlist) use ($user) {
            if ($user) {
                // Asegúrate de que tus policies 'edit' y 'delete' existen para Playlist
                $playlist->can = [
                    'edit' => $user->can('update', $playlist), // Usualmente 'update' para editar
                    'delete' => $user->can('delete', $playlist),
                ];
            } else {
                 $playlist->can = [
                    'edit' => false,
                    'delete' => false,
                ];
            }
            return $playlist;
        });
        return Inertia::render('playlists/Index', [
            'playlists' => $listasConPermisos,
        ]);
    }

    public function create()
    {
         // Probablemente quieras autorizar la creación
         // $this->authorize('create', Playlist::class);
        return Inertia::render('playlists/Create');
    }

    public function store(StorePlaylistRequest $request)
    {
        // $this->authorize('create', Playlist::class);
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('playlist_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
             unset($datosValidados['imagen']);
        }

        // Asignar user_id si existe la columna en playlists y quieres asociar así al creador
        // Comentado si usas la relación polimórfica 'usuarios' en su lugar
        // if (Schema::hasColumn('playlists', 'user_id')) {
        //      $datosValidados['user_id'] = Auth::id();
        // }

        $listaReproduccion = Playlist::create($datosValidados);

        // Si usas la relación polimórfica 'usuarios' para el creador
        if (method_exists($listaReproduccion, 'usuarios')) {
             $listaReproduccion->usuarios()->attach(Auth::id());
        }

        return redirect()->route('playlists.index')->with('success', 'Playlist creada exitosamente.');
    }

    public function show(Playlist $playlist)
    {
        // Cargar canciones incluyendo el ID del pivot (requiere withPivot en el modelo)
        $playlist->load('canciones');
        Log::info('Mostrando Playlist con Canciones:', ['playlist_id' => $playlist->id, 'songs_count' => $playlist->canciones->count()]);
        return Inertia::render('playlists/Show', [
            'playlist' => $playlist,
        ]);
    }

    public function edit(Playlist $playlist) // Usar Route Model Binding
    {
        $this->authorize('update', $playlist);
        // No es necesario cargar canciones aquí a menos que se muestren en la vista de edición
        return Inertia::render('playlists/Edit', [
            'playlist' => $playlist,
        ]);
    }

    public function update(UpdatePlaylistRequest $request, Playlist $playlist) // Usar FormRequest y Route Model Binding
    {
        $this->authorize('update', $playlist);
        Log::info('Datos de Solicitud de Actualización de Playlist:', $request->except(['imagen_nueva']));
        Log::info('Archivos de Solicitud de Actualización de Playlist:', $request->allFiles());

        $datosValidados = $request->validated(); // Ya están validados por UpdatePlaylistRequest

        $listaReproduccion = $playlist; // Usar el objeto ya inyectado

        $listaReproduccion->nombre = $datosValidados['nombre'];
        $listaReproduccion->descripcion = $datosValidados['descripcion'];

        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'playlist_images';
        $rutaImagenAntigua = $listaReproduccion->imagen;

        if ($request->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $request->file('imagen_nueva');
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
            }
            $nuevaRutaImagen = $nuevoArchivoImagen->store($carpetaDestino, 'public');
            $listaReproduccion->imagen = $nuevaRutaImagen;
        } elseif ($eliminarImagen) {
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
                $listaReproduccion->imagen = null;
            } elseif ($listaReproduccion->imagen) { // Si no existe el archivo pero sí la referencia
                $listaReproduccion->imagen = null;
            }
        }

        $listaReproduccion->save();

        return redirect()->route('playlists.show', $listaReproduccion->id)
                         ->with('success', 'Playlist actualizada exitosamente.');
    }

    public function destroy(Playlist $playlist)
    {
        $this->authorize('delete', $playlist);
        // detach relaciones antes de borrar la playlist
        if (method_exists($playlist, 'usuarios')) {
             $playlist->usuarios()->detach();
        }
        if (method_exists($playlist, 'canciones')) {
             $playlist->canciones()->detach();
        }
        // Borrar imagen si existe
        if ($playlist->imagen) {
            Storage::disk('public')->delete($playlist->imagen);
        }
        $playlist->delete();
        return redirect()->route('playlists.index')->with('success', 'Playlist eliminada exitosamente.');
    }

    public function anadirCancion(Request $request, Playlist $playlist)
    {
        // $this->authorize('update', $playlist); // Autorización recomendada
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);
        $idCancion = $valido['cancion_id'];

        // Siempre añade, permitiendo duplicados
        $playlist->canciones()->attach($idCancion);

        $playlist->load('canciones'); // Recargar para obtener la lista actualizada con el pivot ID
        return redirect()->route('playlists.show', $playlist->id)
                         ->with('success', 'Canción añadida a la playlist.')
                         ->with('playlist', $playlist); // Enviar playlist actualizada
    }

    // Método para quitar por ID de PIVOT
    public function quitarCancionPorPivot(Request $request, Playlist $playlist, $pivotId)
    {
        // $this->authorize('update', $playlist); // Autorización recomendada

        // Buscar y eliminar la fila específica en la tabla pivot usando su ID
        $deleted = $playlist->canciones()
            ->wherePivot('id', $pivotId) // Busca por el ID de la tabla pivot ('pertenece_cancion.id')
            ->detach(); // detach() con wherePivot elimina solo la(s) fila(s) encontrada(s)

        $message = $deleted ? 'Canción eliminada de la playlist.' : 'Error: No se encontró la instancia de la canción.';
        if (!$deleted) {
             Log::warning('Intento de eliminar registro pivot no encontrado', ['playlist_id' => $playlist->id, 'pivot_id' => $pivotId]);
        }

        $playlist->load('canciones'); // Recargar canciones
        return redirect()->route('playlists.show', $playlist->id)
                         ->with('success', $message)
                         ->with('playlist', $playlist); // Enviar playlist actualizada
    }

    // Método buscarCanciones (Devuelve todas las canciones, sin excluir las de la playlist)
    public function buscarCanciones(Request $request, Playlist $playlist)
    {
        $consulta = $request->input('query', '');
        $resultados = [];
        $minQueryLength = 2;

        if (strlen($consulta) >= $minQueryLength) {
            $resultados = Cancion::where('titulo', 'LIKE', "%{$consulta}%")
                ->select('id', 'titulo', 'foto_url') // Solo columnas que existen en 'canciones'
                ->limit(15)
                ->get();
        } else {
            $resultados = Cancion::query()
                ->select('id', 'titulo', 'foto_url') // Solo columnas que existen en 'canciones'
                ->orderBy('titulo')
                ->limit(30)
                ->get();
        }
        return response()->json($resultados);
    }
}
