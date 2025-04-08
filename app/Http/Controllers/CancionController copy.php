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

         // Se manejan los archivos solo cuando se envían, sin hacer el upload hasta que el usuario confirme
         $audioFile = null;
         $fotoFile = null;

         // Si se sube un archivo de audio
         if ($request->hasFile('archivo')) {
             $audioFile = $request->file('archivo');
             $audioExtension = $audioFile->getClientOriginalExtension();
             $audioNombre = "{$randomNumber}_song.$audioExtension";

             // Usar getID3 para analizar el archivo y extraer la duración
             $getID3 = new getID3;
             $audioInfo = $getID3->analyze($audioFile->getRealPath());
             $duration = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : 0;
             $cancion->duracion = $duration;

             // Almacenar archivo de audio en el almacenamiento público
             $audioFile->storeAs('canciones', $audioNombre, 'public');
             $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
         }

         // Si se sube una imagen
         if ($request->hasFile('foto')) {
             $fotoFile = $request->file('foto');
             $fotoExtension = $fotoFile->getClientOriginalExtension();
             $fotoNombre = "{$randomNumber}_pic.$fotoExtension";

             // Guardar la foto en el almacenamiento público
             $fotoFile->storeAs('imagenes', $fotoNombre, 'public');
             $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
         }

         // Guardar la canción
         $cancion->save();

         // Redirigir a la página de canciones con un mensaje de éxito
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

    public function update(Request $request, $id)
    {
        $cancion = Cancion::findOrFail($id);

        $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'archivo_url' => 'nullable|file|mimes:mp3,wav|max:10024',
            'foto_url' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'licencia' => 'nullable|string|max:255',
        ]);

        $cancion->titulo = $request->input('titulo');
        $cancion->genero = $request->input('genero');
        $cancion->licencia = $request->input('licencia');

        $randomNumber = rand(1, 10000000000);

        if ($request->hasFile('archivo_url')) {
            $audioFile = $request->file('archivo_url');
            $audioExtension = $audioFile->getClientOriginalExtension();
            $audioNombre = "{$randomNumber}_song.$audioExtension";

            $getID3 = new \getID3;
            $audioInfo = $getID3->analyze($audioFile->getRealPath());
            $duration = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : 0;
            $cancion->duracion = $duration;

            $audioFile->storeAs('canciones', $audioNombre, 'public');
            $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
        }

        if (!$request->hasFile('archivo_url') && !$cancion->duracion) {
            $cancion->duracion = 0;
        }

        if ($request->hasFile('foto_url')) {
            $fotoFile = $request->file('foto_url');
            $fotoExtension = $fotoFile->getClientOriginalExtension();
            $fotoNombre = "{$randomNumber}_pic.$fotoExtension";

            $fotoFile->storeAs('imagenes', $fotoNombre, 'public');
            $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
        }

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
