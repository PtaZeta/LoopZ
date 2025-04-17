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
        $canciones = Cancion::with('usuarios')->latest()->get();

        $cancionesConPermisos = $canciones->map(function ($cancion) use ($user) {
            if ($user && method_exists($user, 'can')) {
                $cancion->can = [
                    'edit' => $user->can('edit', $cancion),
                    'delete' => $user->can('delete', $cancion),
                ];
            } else {
                 $cancion->can = [
                     'edit' => false,
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
            'archivo' => 'required|file|mimes:mp3,wav|max:10024',
            'foto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'licencia' => 'nullable|string|max:255',
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ]);

        $cancion = new Cancion();
        $cancion->titulo = $request->input('titulo');
        $cancion->genero = $request->input('genero');
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
        $cancion = Cancion::findOrFail($id);
        $this->authorize('update', $cancion);
        return Inertia::render('canciones/Edit', [
            'cancion' => $cancion,
        ]);
    }

    public function update(Request $request, $id)
    {

        Log::info('Update Request Data:', $request->except(['archivo_nuevo', 'foto_nueva']));
        Log::info('Update Request Files:', $request->allFiles());

        $cancion = Cancion::findOrFail($id);
        $this->authorize('update', $cancion);

        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'genero' => 'nullable|string|max:255',
            'archivo_nuevo' => 'nullable|file|mimes:mp3,wav|max:10024',
            'foto_nueva' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'eliminar_foto' => 'nullable|boolean',
            'licencia' => 'nullable|string|max:255',
        ]);

        $cancion->titulo = $validated['titulo'];
        $cancion->genero = $validated['genero'] ?? null;
        $cancion->licencia = $validated['licencia'] ?? null;

        $randomNumber = rand(1, 10000000000);

        if ($request->hasFile('archivo_nuevo')) {
            $newAudioFile = $request->file('archivo_nuevo');
            $oldAudioUrl = $cancion->archivo_url;
            $oldAudioPath = $this->getRelativePath($oldAudioUrl);

            if ($oldAudioPath && Storage::disk('public')->exists($oldAudioPath)) {
                Storage::disk('public')->delete($oldAudioPath);
            }

            $audioExtension = $newAudioFile->getClientOriginalExtension();
            $audioNombre = "{$randomNumber}_song.$audioExtension}";

            try {
                $getID3 = new getID3;
                $audioInfo = $getID3->analyze($newAudioFile->getRealPath());
                $cancion->duracion = isset($audioInfo['playtime_seconds']) ? round($audioInfo['playtime_seconds']) : ($cancion->duracion ?? 0);
                 if(isset($audioInfo['error'])) {
                     Log::error('getID3 error al analizar nuevo audio en update: ' . implode(', ', $audioInfo['error']));
                 }
            } catch (\Exception $e) {
                Log::error('Excepción al usar getID3 en update: ' . $e->getMessage());
            }

            $newAudioFile->storeAs('canciones', $audioNombre, 'public');
            $cancion->archivo_url = asset("storage/canciones/{$audioNombre}");
            Log::info("Nuevo archivo de audio guardado: canciones/{$audioNombre}, URL: {$cancion->archivo_url}");
        }

        $eliminarFoto = $request->boolean('eliminar_foto');
        $oldFotoUrl = $cancion->foto_url;
        $oldFotoPath = $this->getRelativePath($oldFotoUrl);

        if ($request->hasFile('foto_nueva')) {
            $newFotoFile = $request->file('foto_nueva');
            if ($oldFotoPath && Storage::disk('public')->exists($oldFotoPath)) {
                Storage::disk('public')->delete($oldFotoPath);
            }

            $fotoExtension = $newFotoFile->getClientOriginalExtension();
            $fotoNombre = "{$randomNumber}_pic.$fotoExtension}";
            $newFotoFile->storeAs('imagenes', $fotoNombre, 'public');
            $cancion->foto_url = asset("storage/imagenes/{$fotoNombre}");
            Log::info("Nueva foto guardada: imagenes/{$fotoNombre}, URL: {$cancion->foto_url}");

        } elseif ($eliminarFoto) {
            if ($oldFotoPath && Storage::disk('public')->exists($oldFotoPath)) {
                Storage::disk('public')->delete($oldFotoPath);
            }
            $cancion->foto_url = null;
            Log::info("Solicitud para eliminar foto procesada.");
        }





        $cancion->save();

        return redirect()->route('canciones.index')->with('success', 'Canción actualizada exitosamente.');
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

        if (!empty($term)) {
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', '%' . $term . '%')
                  ->orWhere('email', 'like', '%' . $term . '%');
            });
            $limit = 10;
        } else {
            $limit = 50;
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
             if (Str::startsWith($path, 'canciones/') || Str::startsWith($path, 'imagenes/')) {
                  return ltrim($path, '/');
             }
         } catch (\Exception $e) {
             Log::error("Error al parsear URL para obtener ruta relativa: {$url} - Error: {$e->getMessage()}");
             return null;
         }


         return null;
     }
}
