<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use getID3;

class CancionController extends Controller
{
    /**
     * Muestra la lista de canciones.
     */
    public function index()
    {
        $canciones = Cancion::all();

        return Inertia::render('canciones/Canciones', [
            'canciones' => $canciones,
        ]);
    }


    /**
     * Muestra el formulario para crear una nueva canción.S
     */
    public function create()
    {
        return Inertia::render('canciones/CrearCancion');
    }

    /**
     * Almacena una nueva canción en la base de datos y guarda los archivos.
     */
    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'archivo' => 'required|file|mimes:mp3,wav|max:10024',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'licencia' => 'nullable|string|max:255',
        ]);

        // Crear la canción sin los archivos aún
        $cancion = new Cancion();
        $cancion->titulo = $request->input('titulo');
        $cancion->genero = $request->input('genero');
        $cancion->licencia = $request->input('licencia');

        // Encontrar el último número de canción en la base de datos (sin importar el usuario)
        $lastCancion = Cancion::latest()->first();
        $nextNumber = $lastCancion ? (explode('_', basename($lastCancion->archivo_url))[0] + 1) : 1; // Incrementar el número o empezar en 1

        // Generar nombre de archivo para el audio
        $audioExtension = $request->file('archivo')->getClientOriginalExtension();
        $audioNombre = "{$nextNumber}_song.$audioExtension";

        // Guardar archivo de audio y obtener su ruta temporal
        if ($request->hasFile('archivo')) {
            $audioFile = $request->file('archivo');
            $tempPath = $audioFile->getRealPath();

            // Usar getID3 para analizar el archivo y extraer la duración
            $getID3 = new getID3;
            $audioInfo = $getID3->analyze($tempPath);
            // Asegurarse de que se haya detectado la duración
            $duration = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : 0;
            $cancion->duracion = $duration;

            // Guardar el archivo en storage
            $audioFile->storeAs('canciones', $audioNombre, 'public');
            $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
        }

        // Generar nombre para la foto
        if ($request->hasFile('foto')) {
            $fotoExtension = $request->file('foto')->getClientOriginalExtension();
            $fotoNombre = "{$nextNumber}_pic.$fotoExtension";
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
    public function edit($id)
    {
        $cancion = Cancion::findOrFail($id);
        return Inertia::render('canciones/EditarCancion', [
            'cancion' => $cancion
        ]);
    }

    /**
     * Actualiza la información de una canción en la base de datos.
     */
    // CancionController.php

    public function update(Request $request, Cancion $cancion)
{
    $validated = $request->validate([
        'titulo'   => 'required|string|max:255',
        'genero'   => 'nullable|string|max:255',
        'archivo'  => 'nullable|file|mimes:mp3,wav|max:10024',
        'foto'     => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        'licencia' => 'nullable|string|max:255',
    ]);
    dd($cancion->toArray());    // Actualizar campos de texto
    $cancion->titulo   = $request->input('titulo');
    $cancion->genero   = $request->input('genero');
    $cancion->licencia = $request->input('licencia');

    $archivoCancion = $cancion->id . '_song.mp3';
    $fotoCancion  = $cancion->id . '_pic.jpg';

    if ($request->hasFile('archivo_url')) {
        $archivo = $request->file('archivo_url');
        $archivo->storeAs('imagenes', $archivoCancion, 'public');
        $cancion->archivo_url = asset("storage/canciones/{$archivoCancion}");
    } else {
        $cancion->archivo_url = $cancion->archivo_url;
    }
    if ($request->hasFile('foto_url')) {
        $foto = $request->file('foto_url');
        $foto->storeAs('imagenes', $fotoCancion, 'public');
        $cancion->foto_url = asset("storage/imagenes/{$fotoCancion}");
    } else {
        $cancion->foto_url = $cancion->foto_url;
    }
    // $audioFile = $cancion->archivo;
    // $tempPath = $audioFile->getRealPath();

    // // Usar getID3 para analizar el archivo y extraer la duración
    // $getID3 = new getID3;
    // $audioInfo = $getID3->analyze($tempPath);
    // // Asegurarse de que se haya detectado la duración
    // $duration = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : 0;
    // $cancion->duracion = $duration;
    $cancion->duracion = 32;
    $cancion->save();

    return redirect()->route('canciones.index')
        ->with('success', 'Canción actualizada exitosamente.');
}











    /**
     * Elimina una canción de la base de datos y sus archivos.
     */
    public function destroy($id)
    {
        $cancion = Cancion::findOrFail($id);
        Storage::delete(str_replace('/storage/', 'public/', $cancion->archivo_url));
        if ($cancion->foto_url) {
            Storage::delete(str_replace('/storage/', 'public/', $cancion->foto_url));
        }

        $cancion->delete();

        return redirect()->route('canciones.index')->with('success', 'Canción eliminada correctamente.');
    }
}
