<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\User;
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
    public function index()
    {
        $user = Auth::user();

        $query = Cancion::with('usuarios')->latest();

        if ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('publico', true)
                  ->orWhereHas('usuarios', function ($q2) use ($user) {
                      $q2->where('user_id', $user->id);
                  });
            });
        } else {
            $query->where('publico', true);
        }

        $canciones = $query->get();

        $cancionesConPermisos = $canciones->map(function ($cancion) use ($user) {
            if ($user && method_exists($user, 'can')) {
                $cancion->can = [
                    'edit'   => $user->can('update', $cancion),
                    'delete' => $user->can('delete', $cancion),
                ];
            } else {
                $cancion->can = [
                    'edit'   => false,
                    'delete' => false,
                ];
            }
            return $cancion;
        });

        return Inertia::render('canciones/Canciones', [
            'canciones' => $cancionesConPermisos,
        ]);
    }


    public function create()
    {
        return Inertia::render('canciones/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'publico' => 'required|boolean',
            'archivo' => 'required|file|mimes:mp3,wav|max:10024',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'licencia' => 'nullable|string|max:255',
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $cancion = new Cancion();
        $cancion->titulo = $request->input('titulo');
        $cancion->genero = $request->input('genero');
        $cancion->publico = $request->input('publico');
        $cancion->licencia = $request->input('licencia');

        $randomNumber = rand(1, 10000000000);


        if ($request->hasFile('archivo')) {
            $audioFile = $request->file('archivo');
            $audioExtension = $audioFile->getClientOriginalExtension();
            $audioNombre = "{$randomNumber}_song.{$audioExtension}";

            try {
                $getID3 = new getID3;
                $audioInfo = $getID3->analyze($audioFile->getRealPath());
                $cancion->duracion = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : 0;
                 if(isset($audioInfo['error'])) {
                     Log::error('getID3 error al analizar audio en store: ' . implode(', ', $audioInfo['error']));
                 }
            } catch (\Exception $e) {
                 Log::error('Excepción al usar getID3 en store: ' . $e->getMessage());
                 $cancion->duracion = 0;
            }

            $audioFile->storeAs('canciones', $audioNombre, 'public');
            $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
        } else {
             return back()->withErrors(['archivo' => 'El archivo de audio es obligatorio.'])->withInput();
        }


        if ($request->hasFile('foto')) {
            $fotoFile = $request->file('foto');
            $fotoExtension = $fotoFile->getClientOriginalExtension();
            $fotoNombre = "{$randomNumber}_pic.{$fotoExtension}";
            $fotoFile->storeAs('imagenes', $fotoNombre, 'public');
            $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
        }

        $cancion->save();


        $userIdsToAttach = $request->input('userIds', []);
        $creatorId = Auth::id();
        if ($creatorId && !in_array($creatorId, $userIdsToAttach)) {
            $userIdsToAttach[] = $creatorId;
        }
        if (!empty($userIdsToAttach) && method_exists($cancion, 'usuarios')) {
             $cancion->usuarios()->attach(array_unique($userIdsToAttach));
        } elseif (!method_exists($cancion, 'usuarios')){
             Log::warning('Método usuarios() no existe en el modelo Cancion al intentar asociar usuarios en store.');
        }


        return redirect()->route('canciones.index')->with('success', 'Canción creada exitosamente.');
    }

    public function show($id)
    {
        $cancion = Cancion::with('usuarios')->findOrFail($id);
        return Inertia::render('canciones/Show', [
            'cancion' => $cancion
        ]);
    }

     public function edit($id)
     {
         $cancion = Cancion::with('usuarios')->findOrFail($id);
         $this->authorize('update', $cancion);

         return Inertia::render('canciones/Edit', [
             'cancion' => $cancion,
         ]);
     }


     public function update(Request $request, $id)
     {
         Log::info('Update Request Data:', $request->except(['_method', 'archivo_nuevo', 'foto_nueva']));
         Log::info('Update Request Files:', $request->allFiles());

         $cancion = Cancion::with('usuarios')->findOrFail($id);
         $this->authorize('update', $cancion);

         $validated = $request->validate([
             'titulo' => 'required|string|max:255',
             'genero' => 'nullable|string|max:255',
             'publico' => 'required|boolean',
             'archivo_nuevo' => 'nullable|file|mimes:mp3,wav|max:10024',
             'foto_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
             'eliminar_foto' => 'nullable|boolean',
             'licencia' => 'nullable|string|max:255',
             'userIds' => 'nullable|array',
             'userIds.*' => 'integer|exists:users,id',
         ]);

         Log::info('Validated Data:', $validated);

         $cancion->titulo = $validated['titulo'];
         $cancion->genero = $validated['genero'] ?? null;
         $cancion->licencia = $validated['licencia'] ?? null;
         $cancion->publico = $validated['publico'];

         $randomNumber = rand(1, 10000000000);

         if ($request->hasFile('archivo_nuevo')) {
             $newAudioFile = $request->file('archivo_nuevo');
             $oldAudioUrl = $cancion->archivo_url;
             $oldAudioPath = $this->getRelativePath($oldAudioUrl);

             if ($oldAudioPath && Storage::disk('public')->exists($oldAudioPath)) {
                 Storage::disk('public')->delete($oldAudioPath);
                 Log::info("Archivo de audio antiguo eliminado: {$oldAudioPath}");
             } else if ($oldAudioPath) {
                  Log::warning("No se encontró el archivo de audio antiguo para eliminar: {$oldAudioPath}");
             }

             $audioExtension = $newAudioFile->getClientOriginalExtension();
             $audioNombre = "{$randomNumber}_song.{$audioExtension}";

             try {
                 $getID3 = new getID3;
                 $audioInfo = $getID3->analyze($newAudioFile->getRealPath());
                 $cancion->duracion = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : ($cancion->duracion ?? 0);
                 if(isset($audioInfo['error'])) {
                     Log::error('getID3 error al analizar nuevo audio en update: ' . implode(', ', $audioInfo['error']));
                 }
             } catch (\Exception $e) {
                 Log::error('Excepción al usar getID3 en update: ' . $e->getMessage());
                 $cancion->duracion = $cancion->duracion ?? 0;
             }

             $newAudioFile->storeAs('canciones', $audioNombre, 'public');
             $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
             Log::info("Nuevo archivo de audio guardado: canciones/{$audioNombre}, URL: {$cancion->archivo_url}");
         }

         $eliminarFoto = $request->boolean('eliminar_foto');
         $oldFotoUrl = $cancion->foto_url;
         $oldFotoPath = $this->getRelativePath($oldFotoUrl);

         if ($request->hasFile('foto_nueva')) {
              Log::info("Procesando nueva foto...");
             $newFotoFile = $request->file('foto_nueva');
             if ($oldFotoPath && Storage::disk('public')->exists($oldFotoPath)) {
                 Storage::disk('public')->delete($oldFotoPath);
                 Log::info("Foto antigua eliminada: {$oldFotoPath}");
             } else if ($oldFotoPath) {
                  Log::warning("No se encontró la foto antigua para eliminar: {$oldFotoPath}");
             }

             $fotoExtension = $newFotoFile->getClientOriginalExtension();
             $fotoNombre = "{$randomNumber}_pic.{$fotoExtension}";
             $newFotoFile->storeAs('imagenes', $fotoNombre, 'public');
             $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
              Log::info("Nueva foto guardada: imagenes/{$fotoNombre}, URL: {$cancion->foto_url}");

         } elseif ($eliminarFoto) {
              Log::info("Procesando solicitud para eliminar foto...");
             if ($oldFotoPath && Storage::disk('public')->exists($oldFotoPath)) {
                 Storage::disk('public')->delete($oldFotoPath);
                  Log::info("Foto antigua eliminada por solicitud: {$oldFotoPath}");
             } else if ($oldFotoPath) {
                  Log::warning("No se encontró la foto antigua para eliminarla por solicitud: {$oldFotoPath}");
             }
             $cancion->foto_url = null;
         }

         $cancion->save();
         Log::info("Canción ID {$id} guardada con detalles básicos.");

         if (method_exists($cancion, 'usuarios')) {
              $userIdsToSync = $validated['userIds'] ?? ($request->input('userIds', []));
              if (!is_array($userIdsToSync)) {
                  $userIdsToSync = [];
              }

             $uniqueUserIds = array_unique(array_map('intval', $userIdsToSync));

             Log::info("Sincronizando usuarios para canción ID {$id}. IDs recibidos: " . implode(', ', $userIdsToSync) . ". IDs únicos a sincronizar: " . implode(', ', $uniqueUserIds));

             $syncResult = $cancion->usuarios()->sync($uniqueUserIds);
             Log::info("Resultado de la sincronización de usuarios para canción ID {$id}: ", $syncResult);

         } else {
             Log::warning('Método usuarios() no existe en el modelo Cancion al intentar sincronizar usuarios en update.');
         }

         $updatedCancion = Cancion::with('usuarios')->find($id);
         Log::info('Canción actualizada con usuarios:', $updatedCancion->toArray());

         return Redirect::route('canciones.index')->with('success', 'Canción actualizada exitosamente.');
     }

    public function destroy($id)
    {
        $cancion = Cancion::findOrFail($id);
        $this->authorize('delete', $cancion);

        if (method_exists($cancion, 'usuarios')) {
            $cancion->usuarios()->detach();
        }

        $audioPath = $this->getRelativePath($cancion->archivo_url);
        if ($audioPath && Storage::disk('public')->exists($audioPath)) {
             if (!Storage::disk('public')->delete($audioPath)) {
                 Log::error("Error al eliminar archivo de audio: {$audioPath}");
             }
        } elseif ($audioPath) {
             Log::warning("No se encontró el archivo de audio para eliminar: {$audioPath}");
        }

        $fotoPath = $this->getRelativePath($cancion->foto_url);
         if ($fotoPath && Storage::disk('public')->exists($fotoPath)) {
              if (!Storage::disk('public')->delete($fotoPath)) {
                  Log::error("Error al eliminar foto: {$fotoPath}");
              }
         } elseif ($fotoPath) {
              Log::warning("No se encontró la foto para eliminar: {$fotoPath}");
         }

        $cancion->delete();

        return redirect()->route('canciones.index')->with('success', 'Canción eliminada correctamente');
    }


    public function searchUsers(Request $request)
    {
        $term = $request->query('q', '');
        $query = User::query();
        $limit = 10; // Set limit to 10 for both cases

        if (!empty($term)) {
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', '%' . $term . '%')
                  ->orWhere('email', 'like', '%' . $term . '%');
            });
        } else {
             // If term is empty, just get the first 10 users ordered by name
             $query->orderBy('name', 'asc');
        }

        $users = $query->select('id', 'name', 'email')
                       ->take($limit)
                       ->get();

        return response()->json($users);
    }


    private function getRelativePath(?string $url): ?string
    {
        if (!$url) return null;
        try {
            $path = parse_url($url, PHP_URL_PATH) ?: '';
            $storagePrefix = '/storage/';
            if (Str::startsWith($path, $storagePrefix)) {
                return Str::after($path, $storagePrefix);
            }
             $trimmedPath = ltrim($path, '/');
             if (Str::startsWith($trimmedPath, 'canciones/') || Str::startsWith($trimmedPath, 'imagenes/')) {
                  return $trimmedPath;
             }
             Log::warning("URL path '{$path}' does not match expected storage patterns ('/storage/', 'canciones/', 'imagenes/').");
             return null;

        } catch (\Exception $e) {
            Log::error("Error al parsear URL '{$url}' para obtener ruta relativa: " . $e->getMessage());
            return null;
        }
    }
}
