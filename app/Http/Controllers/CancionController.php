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
        // Obtiene todas las canciones con su creador (asumiendo que hay una relación 'usuario')
        $canciones = Cancion::all();
        return Inertia::render('canciones/Canciones', [
            'canciones' => $canciones
        ]);
    }



    /**
     * Muestra el formulario para crear una nueva canción.S
     */
    public function create()
    {
        return Inertia::render('canciones/Create');
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

         // Generar un número aleatorio único para la canción y la imagen
         $randomNumber = rand(1, 10000000000);

         // Generar nombre de archivo para el audio
         $audioExtension = $request->file('archivo')->getClientOriginalExtension();
         $audioNombre = "{$randomNumber}_song.$audioExtension";

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
             $fotoNombre = "{$randomNumber}_pic.$fotoExtension";
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
    public function show($id)
    {
        $cancion = Cancion::findOrFail($id);
        return Inertia::render('canciones/Show', [
            'cancion' => $cancion
        ]);
    }

    /**
     * Muestra el formulario para editar una canción.
     */
    public function edit($id)
    {
        $cancion = Cancion::findOrFail($id);

        return Inertia::render('canciones/Edit', [
            'cancion' => $cancion,
        ]);
    }

    /**
     * Actualiza la información de una canción en la base de datos.
     */
    // CancionController.php

    public function update(Request $request, Cancion $cancion)
{
    $request->validate([
        'titulo' => 'required|string|max:255',
        'genero' => 'nullable|string|max:255',
        'archivo' => 'nullable|file|mimes:mp3,wav|max:10024',
        'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        'licencia' => 'nullable|string|max:255',
    ]);

    // Actualizar campos simples
    $cancion->titulo = $request->input('titulo');
    $cancion->genero = $request->input('genero');
    $cancion->licencia = $request->input('licencia');

    // Generar un número aleatorio único (para nombre de archivos)
    $randomNumber = rand(1, 10000000000);

    // Si se sube un nuevo archivo de audio
    if ($request->hasFile('archivo')) {
        $audioExtension = $request->file('archivo')->getClientOriginalExtension();
        $audioNombre = "{$randomNumber}_song.$audioExtension";

        $audioFile = $request->file('archivo');
        $tempPath = $audioFile->getRealPath();

        // Obtener duración con getID3
        $getID3 = new getID3;
        $audioInfo = $getID3->analyze($tempPath);
        $duration = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : 0;
        $cancion->duracion = $duration;

        // Guardar nuevo archivo de audio
        $audioFile->storeAs('canciones', $audioNombre, 'public');
        $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
    }

    // Si no se sube un nuevo archivo, mantener la duración anterior (si existe)
    if (!$request->hasFile('archivo') && !$cancion->duracion) {
        // Si no se sube archivo, se podría asignar un valor predeterminado o dejarlo vacío
        $cancion->duracion = 0; // Puedes cambiar esto por un valor por defecto si lo prefieres
    }

    // Si se sube una nueva foto
    if ($request->hasFile('foto')) {
        $fotoExtension = $request->file('foto')->getClientOriginalExtension();
        $fotoNombre = "{$randomNumber}_pic.$fotoExtension";

        $request->file('foto')->storeAs('imagenes', $fotoNombre, 'public');
        $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
    }

    // Guardar la canción
    $cancion->save();

    return redirect()->route('canciones.index')->with('success', 'Canción actualizada correctamente.');
}




    /**
     * Elimina una canción de la base de datos y sus archivos.
     */
    public function destroy($id)
    {
        $cancion = Cancion::findOrFail($id);
        $cancion->delete();

        return redirect()->route('canciones.index')->with('success', 'Canción eliminada correctamente');
    }

}
