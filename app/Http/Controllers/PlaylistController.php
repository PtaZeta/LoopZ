<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlaylistRequest;
use App\Http\Requests\UpdatePlaylistRequest;
use App\Models\Playlist;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log; // Para registrar información útil

class PlaylistController extends Controller
{
    public function index()
    {
        $playlists = Playlist::all();
        return Inertia::render('playlists/Index', [
            'playlists' => $playlists,
        ]);
    }

    public function create()
    {
        return Inertia::render('playlists/Create');
    }

    public function store(StorePlaylistRequest $request)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('imagen')) {
            $path = $request->file('imagen')->store('playlist_images', 'public');
            $validatedData['imagen'] = $path;
        } else {
             unset($validatedData['imagen']);
             // $validatedData['imagen'] = null;
        }

        $playlist = Playlist::create($validatedData);

        return redirect()->route('playlists.index')->with('success', 'Playlist creada exitosamente.');
    }

    public function show(Playlist $playlist)
    {
        return Inertia::render('playlists/Show', [
            'playlist' => $playlist,
        ]);
    }

    public function edit($id)
    {
        $playlist = Playlist::findOrFail($id);
        // $playlist->append('imagen_url'); // Descomenta si usas el accesor y no se añade automáticamente
        return Inertia::render('playlists/Edit', [
            'playlist' => $playlist,
        ]);
    }


    /**
     * Actualiza la información de una playlist existente.
     * CORREGIDO PARA USAR 'playlist_images' Y GUARDAR RUTA RELATIVA.
     */
    public function update(Request $request, $id) // Cambia Request a UpdatePlaylistRequest si lo creas
    {
        Log::info('Playlist Update Request Data:', $request->except(['imagen_nueva']));
        Log::info('Playlist Update Request Files:', $request->allFiles());

        $playlist = Playlist::findOrFail($id);

        // Validación (ajusta si usas UpdatePlaylistRequest)
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:65535',
            'imagen_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'eliminar_imagen' => 'nullable|boolean',
        ]);

        $playlist->nombre = $validated['nombre'];
        $playlist->descripcion = $validated['descripcion'];

        // --- Manejo de la Imagen ---
        $eliminarImagen = $request->boolean('eliminar_imagen');
        $targetFolder = 'playlist_images'; // <--- CARPETA CORRECTA

        // Obtener la ruta relativa ANTIGUA (esperamos 'playlist_images/nombre.jpg')
        $oldImagePath = $playlist->imagen;

        // 1. Si se sube una nueva imagen ('imagen_nueva' del formulario Edit)
        if ($request->hasFile('imagen_nueva')) {
            $newImageFile = $request->file('imagen_nueva');

            // Borrar la imagen antigua si existe la ruta y el archivo
            if ($oldImagePath && Storage::disk('public')->exists($oldImagePath)) {
                Storage::disk('public')->delete($oldImagePath);
                Log::info("Imagen antigua de playlist eliminada: " . $oldImagePath);
            } elseif ($oldImagePath) {
                 Log::warning("Se encontró ruta de imagen antigua ({$oldImagePath}) pero el archivo no existe en el disco 'public'.");
            }

            // Guardar la nueva imagen usando store() en la carpeta correcta
            // Devuelve la ruta relativa: 'playlist_images/hash.jpg'
            $newImagePath = $newImageFile->store($targetFolder, 'public'); // <--- USA store() y targetFolder

            // Actualizar el campo 'imagen' con la NUEVA RUTA RELATIVA
            $playlist->imagen = $newImagePath; // <--- GUARDA RUTA RELATIVA
            Log::info("Nueva imagen de playlist guardada en: " . $newImagePath);

        // 2. Si NO se sube nueva imagen, pero se marca eliminar_imagen
        } elseif ($eliminarImagen) {
            // Borrar la imagen antigua si existe la ruta y el archivo
            if ($oldImagePath && Storage::disk('public')->exists($oldImagePath)) {
                Storage::disk('public')->delete($oldImagePath);
                $playlist->imagen = null; // Poner a null la columna en la BD
                Log::info("Imagen antigua de playlist eliminada (vía checkbox): " . $oldImagePath);
            } elseif ($playlist->imagen) { // Si había ruta pero no se encontró archivo
                $playlist->imagen = null;
                if ($oldImagePath) Log::warning("No se encontró el archivo de la imagen antigua en '{$oldImagePath}' para eliminar (vía checkbox), pero se eliminó la referencia en BD.");
            }
        }
        // 3. Si no se sube nueva imagen ni se marca eliminar, no hacemos nada con $playlist->imagen.

        // Guardar los cambios
        $playlist->save();

        return redirect()->route('playlists.index')->with('success', 'Playlist actualizada exitosamente.');
    }



    public function destroy(Playlist $playlist)
    {
        if ($playlist->imagen) {
            Storage::disk('public')->delete($playlist->imagen);
        }

        $playlist->delete();

        return redirect()->route('playlists.index')->with('success', 'Playlist eliminada exitosamente.');
    }
}
