<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use getID3;
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

        $numeroAleatorio = rand(1, 10000000000);


        if ($request->hasFile('archivo')) {
            $archivoAudio = $request->file('archivo');
            $extensionAudio = $archivoAudio->getClientOriginalExtension();
            $nombreAudio = "{$numeroAleatorio}_song.{$extensionAudio}";

            try {
                $getID3 = new getID3;
                $infoAudio = $getID3->analyze($archivoAudio->getRealPath());
                $cancion->duracion = isset($infoAudio['playtime_seconds']) ? round($infoAudio['playtime_seconds']) : 0;
            } catch (\Exception $e) {
                $cancion->duracion = 0;
            }

            $archivoAudio->storeAs('canciones', $nombreAudio, 'public');
            $cancion->archivo_url = asset("storage/canciones/{$nombreAudio}");
        } else {
            return back()->withErrors(['archivo' => 'El archivo de audio es obligatorio.'])->withInput();
        }


        if ($request->hasFile('foto')) {
            $archivoFoto = $request->file('foto');
            $extensionFoto = $archivoFoto->getClientOriginalExtension();
            $nombreFoto = "{$numeroAleatorio}_pic.{$extensionFoto}";
            $archivoFoto->storeAs('imagenes', $nombreFoto, 'public');
            $cancion->foto_url = asset("storage/imagenes/{$nombreFoto}");
        }

        $cancion->save();


        $idsUsuariosAsociar = $request->input('userIds', []);
        $idCreador = Auth::id();
        if ($idCreador && !in_array($idCreador, $idsUsuariosAsociar)) {
            $idsUsuariosAsociar[] = $idCreador;
        }
        if (!empty($idsUsuariosAsociar) && method_exists($cancion, 'usuarios')) {
             $cancion->usuarios()->attach(array_unique($idsUsuariosAsociar));
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


         $cancion->titulo = $validated['titulo'];
         $cancion->genero = $validated['genero'] ?? null;
         $cancion->licencia = $validated['licencia'] ?? null;
         $cancion->publico = $validated['publico'];

         $numeroAleatorio = rand(1, 10000000000);

         if ($request->hasFile('archivo_nuevo')) {
             $nuevoArchivoAudio = $request->file('archivo_nuevo');
             $urlAudioAntiguo = $cancion->archivo_url;
             $rutaAudioAntiguo = $this->getRelativePath($urlAudioAntiguo);

             if ($rutaAudioAntiguo && Storage::disk('public')->exists($rutaAudioAntiguo)) {
                 Storage::disk('public')->delete($rutaAudioAntiguo);
             }

             $extensionAudio = $nuevoArchivoAudio->getClientOriginalExtension();
             $nombreAudio = "{$numeroAleatorio}_song.{$extensionAudio}";

             try {
                 $getID3 = new getID3;
                 $infoAudio = $getID3->analyze($nuevoArchivoAudio->getRealPath());
                 $cancion->duracion = isset($infoAudio['playtime_seconds']) ? round($infoAudio['playtime_seconds']) : ($cancion->duracion ?? 0);
             } catch (\Exception $e) {
                 $cancion->duracion = $cancion->duracion ?? 0;
             }

             $nuevoArchivoAudio->storeAs('canciones', $nombreAudio, 'public');
             $cancion->archivo_url = asset("storage/canciones/{$nombreAudio}");
         }

         $eliminarFoto = $request->boolean('eliminar_foto');
         $urlFotoAntigua = $cancion->foto_url;
         $rutaFotoAntigua = $this->getRelativePath($urlFotoAntigua);

         if ($request->hasFile('foto_nueva')) {
             $nuevoArchivoFoto = $request->file('foto_nueva');
             if ($rutaFotoAntigua && Storage::disk('public')->exists($rutaFotoAntigua)) {
                 Storage::disk('public')->delete($rutaFotoAntigua);
             }

             $extensionFoto = $nuevoArchivoFoto->getClientOriginalExtension();
             $nombreFoto = "{$numeroAleatorio}_pic.{$extensionFoto}";
             $nuevoArchivoFoto->storeAs('imagenes', $nombreFoto, 'public');
             $cancion->foto_url = asset("storage/imagenes/{$nombreFoto}");

         } elseif ($eliminarFoto) {
             if ($rutaFotoAntigua && Storage::disk('public')->exists($rutaFotoAntigua)) {
                 Storage::disk('public')->delete($rutaFotoAntigua);
             }
             $cancion->foto_url = null;
         }

         $cancion->save();


         if (method_exists($cancion, 'usuarios')) {
              $idsUsuariosSincronizar = $validated['userIds'] ?? ($request->input('userIds', []));
              if (!is_array($idsUsuariosSincronizar)) {
                  $idsUsuariosSincronizar = [];
              }

             $idsUsuariosUnicos = array_unique(array_map('intval', $idsUsuariosSincronizar));

              $cancion->usuarios()->sync($idsUsuariosUnicos);
         }


         return Redirect::route('canciones.index')->with('success', 'Canción actualizada exitosamente.');
     }

    public function destroy($id)
    {
        $cancion = Cancion::findOrFail($id);
        $this->authorize('delete', $cancion);

        if (method_exists($cancion, 'usuarios')) {
            $cancion->usuarios()->detach();
        }

        $rutaAudio = $this->getRelativePath($cancion->archivo_url);
        if ($rutaAudio && Storage::disk('public')->exists($rutaAudio)) {
             Storage::disk('public')->delete($rutaAudio);
        }

        $rutaFoto = $this->getRelativePath($cancion->foto_url);
         if ($rutaFoto && Storage::disk('public')->exists($rutaFoto)) {
             Storage::disk('public')->delete($rutaFoto);
         }

        $cancion->delete();

        return redirect()->route('canciones.index')->with('success', 'Canción eliminada correctamente');
    }

    public function buscarUsuarios(Request $request)
    {
        $termino = $request->query('q', '');
        $limite = 10;
        $query = User::query();

        $usuarioActualId = Auth::id();
        if ($usuarioActualId) {
             $query->where('id', '!=', $usuarioActualId);
        }

        if (!empty($termino)) {
            $query->where(function ($q) use ($termino) {
                $q->where('name', 'like', '%' . $termino . '%')
                  ->orWhere('email', 'like', '%' . $termino . '%');
            });
        } else {
            $query->orderBy('name', 'asc');
        }

        $usuarios = $query->select('id', 'name', 'email')
                        ->take($limite)
                        ->get();

        return response()->json($usuarios);
    }

       private function getRelativePath(?string $url): ?string
       {
           if (!$url) return null;
           try {
               $path = parse_url($url, PHP_URL_PATH) ?: '';
               $prefijoStorage = '/storage/';
               if (Str::startsWith($path, $prefijoStorage)) {
                   return Str::after($path, $prefijoStorage);
               }
               $rutaRecortada = ltrim($path, '/');
               if (Str::startsWith($rutaRecortada, 'canciones/') || Str::startsWith($rutaRecortada, 'imagenes/')) {
                    return $rutaRecortada;
               }
               return null;

           } catch (\Exception $e) {
               return null;
           }
       }
}
