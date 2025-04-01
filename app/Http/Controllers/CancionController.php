<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class CancionController extends Controller
{
    /**
     * Muestra la lista de canciones.
     */
    public function index()
    {
        $canciones = Cancion::all();

        return Inertia::render('Canciones', [
            'canciones' => $canciones
        ]);
    }

    /**
     * Muestra el formulario para crear una nueva canción.
     */
    public function create()
    {
        return Inertia::render('CrearCancion');
    }

    /**
     * Almacena una nueva canción en la base de datos y guarda los archivos.
     */
    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'duracion' => 'required|integer|min:1',
            'archivo' => 'required|file|mimes:mp3,wav|max:10240',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'licencia' => 'nullable|string|max:255',
        ]);

        // Crear la canción sin los archivos aún
        $cancion = new Cancion();
        $cancion->titulo = $request->input('titulo');
        $cancion->genero = $request->input('genero');
        $cancion->duracion = $request->input('duracion');
        $cancion->licencia = $request->input('licencia');

        // Encontrar el último número de canción en la base de datos (sin importar el usuario)
        $lastCancion = Cancion::latest()->first();
        $nextNumber = $lastCancion ? (explode('_', basename($lastCancion->archivo_url))[0] + 1) : 1; // Incrementar el número o empezar en 1

        // Generar nombre de archivo para el audio
        $audioNombre = "{$nextNumber}_song." . $request->file('archivo')->getClientOriginalExtension();

        // Guardar archivo de audio si se subió
        if ($request->hasFile('archivo')) {
            $request->file('archivo')->storeAs('canciones', $audioNombre, 'public');
            $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
        }

        // Generar nombre para la foto
        $fotoNombre = "{$nextNumber}_pic." . $request->file('foto')->getClientOriginalExtension();

        // Guardar imagen si se subió
        if ($request->hasFile('foto')) {
            $request->file('foto')->storeAs('imagenes', $fotoNombre, 'public');
            $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
        }

        // Guardar cambios
        $cancion->save();

        return redirect()->route('canciones.index')->with('success', 'Canción creada exitosamente.');
    }



    /**
     * Muestra los detalles de una canción específica.
     */
    public function show(Cancion $cancion)
    {
        return Inertia::render('MostrarCancion', [
            'cancion' => $cancion
        ]);
    }

    /**
     * Muestra el formulario para editar una canción.
     */
    public function edit(Cancion $cancion)
    {
        return Inertia::render('EditarCancion', [
            'cancion' => $cancion
        ]);
    }

    /**
     * Actualiza la información de una canción en la base de datos.
     */
    public function update(Request $request, Cancion $cancion)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'duracion' => 'required|integer|min:1',
            'archivo' => 'nullable|file|mimes:mp3,wav',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png',
            'licencia' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('archivo')) {
            Storage::delete(str_replace('/storage/', 'public/', $cancion->archivo_url));
            $archivoPath = $request->file('archivo')->store("public/canciones/{$cancion->user_id}");
            $cancion->archivo_url = Storage::url($archivoPath);
        }

        if ($request->hasFile('foto')) {
            Storage::delete(str_replace('/storage/', 'public/', $cancion->foto_url));
            $fotoPath = $request->file('foto')->store("public/canciones/{$cancion->user_id}");
            $cancion->foto_url = Storage::url($fotoPath);
        }

        $cancion->update($request->except(['archivo', 'foto']));

        return redirect()->route('canciones.index');
    }

    /**
     * Elimina una canción de la base de datos y sus archivos.
     */
    public function destroy(Cancion $cancion)
    {
        Storage::delete(str_replace('/storage/', 'public/', $cancion->archivo_url));
        if ($cancion->foto_url) {
            Storage::delete(str_replace('/storage/', 'public/', $cancion->foto_url));
        }

        $cancion->delete();

        return redirect()->route('canciones.index');
    }
}
