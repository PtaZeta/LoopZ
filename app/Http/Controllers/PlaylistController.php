<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlaylistRequest;
use App\Http\Requests\UpdatePlaylistRequest;
use App\Models\Playlist;
use App\Models\Cancion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PlaylistController extends Controller
{
    public function index()
    {
        $listasReproduccion = Playlist::all();
        return Inertia::render('playlists/Index', [
            'playlists' => $listasReproduccion,
        ]);
    }

    public function create()
    {
        return Inertia::render('playlists/Create');
    }

    public function store(StorePlaylistRequest $request)
    {
        $datosValidados = $request->validated();

        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('playlist_images', 'public');
            $datosValidados['imagen'] = $ruta;
        } else {
             unset($datosValidados['imagen']);
        }

        $listaReproduccion = Playlist::create($datosValidados);

        if (method_exists($listaReproduccion, 'usuarios')) {
             $listaReproduccion->usuarios()->attach(Auth::id());
        }

        return redirect()->route('playlists.index')->with('success', 'Playlist creada exitosamente.');
    }

    public function show(Playlist $playlist)
    {
        $playlist->load('canciones');

        Log::info('Mostrando Playlist con Canciones:', ['playlist_id' => $playlist->id, 'songs_count' => $playlist->canciones->count()]);

        return Inertia::render('playlists/Show', [
            'playlist' => $playlist,
        ]);
    }

    public function edit($id)
    {
        $listaReproduccion = Playlist::findOrFail($id);
        return Inertia::render('playlists/Edit', [
            'playlist' => $listaReproduccion,
        ]);
    }

    public function update(Request $request, $id)
    {
        Log::info('Datos de Solicitud de Actualización de Playlist:', $request->except(['imagen_nueva']));
        Log::info('Archivos de Solicitud de Actualización de Playlist:', $request->allFiles());

        $listaReproduccion = Playlist::findOrFail($id);

        $valido = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:65535',
            'imagen_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'eliminar_imagen' => 'nullable|boolean',
        ]);

        $listaReproduccion->nombre = $valido['nombre'];
        $listaReproduccion->descripcion = $valido['descripcion'];

        $eliminarImagen = $request->boolean('eliminar_imagen');
        $carpetaDestino = 'playlist_images';

        $rutaImagenAntigua = $listaReproduccion->imagen;

        if ($request->hasFile('imagen_nueva')) {
            $nuevoArchivoImagen = $request->file('imagen_nueva');

            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
                Log::info("Imagen antigua de playlist eliminada: " . $rutaImagenAntigua);
            } elseif ($rutaImagenAntigua) {
                 Log::warning("Se encontró ruta de imagen antigua ({$rutaImagenAntigua}) pero el archivo no existe en el disco 'public'.");
            }

            $nuevaRutaImagen = $nuevoArchivoImagen->store($carpetaDestino, 'public');
            $listaReproduccion->imagen = $nuevaRutaImagen;
            Log::info("Nueva imagen de playlist guardada en: " . $nuevaRutaImagen);

        } elseif ($eliminarImagen) {
            if ($rutaImagenAntigua && Storage::disk('public')->exists($rutaImagenAntigua)) {
                Storage::disk('public')->delete($rutaImagenAntigua);
                $listaReproduccion->imagen = null;
                Log::info("Imagen antigua de playlist eliminada (vía checkbox): " . $rutaImagenAntigua);
            } elseif ($listaReproduccion->imagen) {
                $listaReproduccion->imagen = null;
                if ($rutaImagenAntigua) Log::warning("No se encontró el archivo de la imagen antigua en '{$rutaImagenAntigua}' para eliminar (vía checkbox), pero se eliminó la referencia en BD.");
            }
        }

        $listaReproduccion->save();

        return redirect()->route('playlists.index')->with('success', 'Playlist actualizada exitosamente.');
    }

    public function destroy(Playlist $playlist)
    {
         if (method_exists($playlist, 'usuarios')) {
             $playlist->usuarios()->detach();
         }
         if (method_exists($playlist, 'canciones')) {
             $playlist->canciones()->detach(); // Desvincular canciones también si es necesario
         }

        if ($playlist->imagen) {
            Storage::disk('public')->delete($playlist->imagen);
        }

        $playlist->delete();

        return redirect()->route('playlists.index')->with('success', 'Playlist eliminada exitosamente.');
    }

    public function anadirCancion(Request $request, Playlist $playlist)
    {
        $valido = $request->validate([
            'cancion_id' => 'required|exists:canciones,id',
        ]);

        $idCancion = $valido['cancion_id'];

        $playlist->canciones()->syncWithoutDetaching([$idCancion]);

        return redirect()->route('playlists.show', $playlist->id)
                         ->with('success', 'Canción añadida a la playlist.');
    }

    public function buscarCanciones(Request $request)
    {
        $consulta = $request->input('query', '');
        $resultados = [];
        $minQueryLength = 2; // Longitud mínima para búsqueda real

        if (strlen($consulta) >= $minQueryLength) {
            // Búsqueda normal por título/artista
            $resultados = Cancion::where('titulo', 'LIKE', "%{$consulta}%")
                // ->orWhere('artista', 'LIKE', "%{$consulta}%") // Descomenta si buscas por artista
                ->select('id', 'titulo')
                ->limit(15) // Limita resultados de búsqueda
                ->get();
        } else {
            // Si la consulta es corta o vacía, devuelve una lista general (limitada)
            $resultados = Cancion::select('id', 'titulo')
                ->orderBy('titulo') // Ordena alfabéticamente (opcional)
                ->limit(30) // Limita cuántas mostrar por defecto
                ->get();
        }

        return response()->json($resultados);
    }

}
