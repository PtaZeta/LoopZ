<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use getID3;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Redirect;

class CancionController extends Controller
{
    /**
     * Muestra la lista de canciones.
     */
    public function index()
    {
        // Obtiene todas las canciones con su creador (asumiendo que hay una relación 'usuario')
        $canciones = Cancion::with('usuarios')->latest()->get();
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

         // Asociar la canción al usuario logueado
         $cancion->usuarios()->attach(Auth::id());

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
        Log::info('Update Request Data:', $request->except(['archivo_nuevo', 'foto_nueva']));
        Log::info('Update Request Files:', $request->allFiles());

        $cancion = Cancion::findOrFail($id);

        // Validación
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'archivo_nuevo' => 'nullable|file|mimes:mp3,wav|max:10024',
            'foto_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'eliminar_foto' => 'nullable|boolean',
            'licencia' => 'nullable|string|max:255',
        ]);

        $cancion->titulo = $validated['titulo'];
        $cancion->genero = $validated['genero'];
        $cancion->licencia = $validated['licencia'];

        $randomNumber = rand(1, 10000000000);

        if ($request->hasFile('archivo_nuevo')) {
            $newAudioFile = $request->file('archivo_nuevo');

            $oldAudioUrl = $cancion->archivo_url;
            $oldAudioPath = null;
            if ($oldAudioUrl) {
                $storagePrefix = '/storage/';
                $pos = strpos($oldAudioUrl, $storagePrefix);
                if ($pos !== false) {
                    $oldAudioPath = substr($oldAudioUrl, $pos + strlen($storagePrefix));
                } else {
                    if (strpos($oldAudioUrl, 'canciones/') === 0) {
                       $oldAudioPath = $oldAudioUrl;
                    } else {
                       Log::warning("No se pudo extraer la ruta relativa de la URL de audio antigua: " . $oldAudioUrl);
                    }
                }

                // Intentar borrar si se encontró la ruta y el archivo existe
                if ($oldAudioPath && Storage::disk('public')->exists($oldAudioPath)) {
                    Storage::disk('public')->delete($oldAudioPath);
                    Log::info("Archivo de audio antiguo eliminado: " . $oldAudioPath);
                } elseif ($oldAudioPath) {
                    Log::warning("No se encontró el archivo de audio antiguo para eliminar: " . $oldAudioPath);
                }
            }
            // --- Fin: Lógica Inline ---

            // 2. Procesar y guardar nuevo archivo
            $audioExtension = $newAudioFile->getClientOriginalExtension();
            $audioNombre = "{$randomNumber}_song.$audioExtension";

            // Usar getID3 para la duración
            try {
                $getID3 = new getID3;
                $audioInfo = $getID3->analyze($newAudioFile->getRealPath());
                if (isset($audioInfo['playtime_seconds'])) {
                    $cancion->duracion = round($audioInfo['playtime_seconds']);
                } elseif (isset($audioInfo['error'])) {
                    Log::error('getID3 error al analizar nuevo audio: ' . implode(', ', $audioInfo['error']));
                    $cancion->duracion = $cancion->duracion ?? 0; // Mantener anterior o 0
                } else {
                    Log::warning('getID3 no pudo determinar la duración del nuevo audio.');
                    $cancion->duracion = $cancion->duracion ?? 0;
                }
            } catch (\Exception $e) {
                Log::error('Excepción al usar getID3: ' . $e->getMessage());
                $cancion->duracion = $cancion->duracion ?? 0;
            }

            // Almacenar nuevo archivo
            $newAudioFile->storeAs('canciones', $audioNombre, 'public');
            $cancion->archivo_url = asset("storage/canciones/{$audioNombre}"); // Guardar nueva URL con asset()
            Log::info("Nuevo archivo de audio guardado: canciones/{$audioNombre}");
        }

        // --- Manejo de Foto ---
        $eliminarFoto = $request->boolean('eliminar_foto');

        // Variable para la ruta antigua de la foto
        $oldFotoPath = null;
        $oldFotoUrl = $cancion->foto_url;

        // --- Inicio: Lógica Inline para obtener ruta relativa de la foto antigua ---
         if ($oldFotoUrl) {
            $storagePrefix = '/storage/';
            $pos = strpos($oldFotoUrl, $storagePrefix);
            if ($pos !== false) {
                $oldFotoPath = substr($oldFotoUrl, $pos + strlen($storagePrefix)); // Extrae 'imagenes/...'
            } else {
                 if (strpos($oldFotoUrl, 'imagenes/') === 0) { // Comprobar si ya es relativa
                     $oldFotoPath = $oldFotoUrl;
                 } else {
                    Log::warning("No se pudo extraer la ruta relativa de la URL de foto antigua: " . $oldFotoUrl);
                 }
            }
        }


        if ($request->hasFile('foto_nueva')) {
            $newFotoFile = $request->file('foto_nueva');
            if ($oldFotoPath && Storage::disk('public')->exists($oldFotoPath)) {
                Storage::disk('public')->delete($oldFotoPath);
                Log::info("Foto antigua eliminada: " . $oldFotoPath);
            } elseif ($oldFotoPath) {
                 Log::warning("No se encontró la foto antigua para eliminar: " . $oldFotoPath);
            }

            $fotoExtension = $newFotoFile->getClientOriginalExtension();
            $fotoNombre = "{$randomNumber}_pic.$fotoExtension";
            $newFotoFile->storeAs('imagenes', $fotoNombre, 'public');
            $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
            Log::info("Nueva foto guardada: imagenes/{$fotoNombre}");

        } elseif ($eliminarFoto) {
            if ($oldFotoPath && Storage::disk('public')->exists($oldFotoPath)) {
                Storage::disk('public')->delete($oldFotoPath);
                $cancion->foto_url = null;
                Log::info("Foto antigua eliminada (vía checkbox): " . $oldFotoPath);
            } elseif($cancion->foto_url) {
                 $cancion->foto_url = null;
                 if($oldFotoPath) Log::warning("No se encontró la foto antigua para eliminar (vía checkbox): " . $oldFotoPath);
            }
        }

        $cancion->save();

        return redirect()->route('canciones.index')->with('success', 'Canción actualizada exitosamente.');
    }



    /**
     * Elimina una canción de la base de datos y sus archivos.
     */
    public function destroy($id)
    {
        $cancion = Cancion::findOrFail($id);

        if (method_exists($cancion, 'usuarios')) {
            $cancion->usuarios()->detach();
        }

        if ($cancion->archivo_url) {
            $fullPath = parse_url($cancion->archivo_url, PHP_URL_PATH);
            $relativePath = null;
            $storagePrefix = '/storage/';

            if ($fullPath && Str::startsWith($fullPath, $storagePrefix)) {
                $relativePath = Str::after($fullPath, $storagePrefix);
            } else {
                 Log::warning("No se pudo extraer la ruta relativa del archivo de audio desde: {$cancion->archivo_url}");
            }

            if ($relativePath) {
                if (Storage::disk('public')->exists($relativePath)) {
                    if (Storage::disk('public')->delete($relativePath)) {
                        Log::info("Archivo de audio eliminado: {$relativePath}");
                    } else {
                         Log::error("Error al eliminar archivo de audio: {$relativePath}");
                    }
                } else {
                    Log::warning("No se encontró el archivo de audio para eliminar (ruta calculada): {$relativePath}");
                }
            }
        }

         if ($cancion->foto_url) {
            $fullPath = parse_url($cancion->foto_url, PHP_URL_PATH);
            $relativePath = null;
            $storagePrefix = '/storage/';

            if ($fullPath && Str::startsWith($fullPath, $storagePrefix)) {
                $relativePath = Str::after($fullPath, $storagePrefix);
            } else {
                 Log::warning("No se pudo extraer la ruta relativa de la foto desde: {$cancion->foto_url}");
            }

            if ($relativePath) {
                if (Storage::disk('public')->exists($relativePath)) {
                     if (Storage::disk('public')->delete($relativePath)) {
                        Log::info("Foto eliminada: {$relativePath}");
                     } else {
                        Log::error("Error al eliminar foto: {$relativePath}");
                     }
                } else {
                    Log::warning("No se encontró la foto para eliminar (ruta calculada): {$relativePath}");
                }
            }
        }

        $cancion->delete();

        return redirect()->route('canciones.index')->with('success', 'Canción eliminada correctamente');
    }


}
