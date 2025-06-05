<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\Cancion;
use App\Models\Contenedor;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use getID3;
use Illuminate\Support\Facades\DB;

function obtenerClaveS3DesdeUrl($url, $nombreBucket) {
    $urlParseada = parse_url($url);
    if ($urlParseada && isset($urlParseada['host']) && isset($urlParseada['path'])) {
        if (strpos($urlParseada['host'], $nombreBucket) !== false) {
            return ltrim($urlParseada['path'], '/');
        }
    }
    return $url;
}


class ProfileController extends Controller
{
    public function show($id): \Inertia\Response
    {
        $usuario = User::findOrFail($id);

        $seguidores = $usuario->seguidores()->get();

        $seguidos = $usuario->seguidos()->get();

        $withUsuariosCallback = function ($query) {
            $query->select('users.id', 'users.name', 'users.foto_perfil');
        };

        $usuarioAuth = auth()->user();
        $esCreador = $usuarioAuth && $usuarioAuth->id === $usuario->id; // Determina si el usuario autenticado es el dueño del perfil

        // --- Lógica de privacidad para Canciones ---
        $cancionesQuery = $usuario->perteneceCanciones()
            ->with([
                'usuarios' => $withUsuariosCallback,
                'contenedores:id,nombre'
            ]);

        // Si el usuario que ve el perfil NO es el creador, solo mostrar canciones públicas
        if (!$esCreador) {
            $cancionesQuery->where('canciones.publico', true); // Se usa la columna 'publico'
        }

        $consultaCanciones = $cancionesQuery->orderBy('pertenece_user.created_at', 'desc')->get();

        $loopzSongIds = $usuarioAuth ? $this->getLoopZUsuario($usuarioAuth) : [];

        $consultaCanciones->each(function ($cancion) use ($loopzSongIds) {
            $cancion->is_in_user_loopz = in_array($cancion->id, $loopzSongIds);
        });

        // --- Lógica de privacidad para Contenedores (Playlists, Álbumes, EPs, Singles) ---
        $contenedoresBaseQuery = $usuario->perteneceContenedores()
            ->with(['usuarios' => $withUsuariosCallback]);

        // Si el usuario que ve el perfil NO es el creador, solo mostrar contenedores públicos
        if (!$esCreador) {
            $contenedoresBaseQuery->where('contenedores.publico', true); // Se usa la columna 'publico'
        }

        $consultaPlaylists = (clone $contenedoresBaseQuery)
            ->where('contenedores.tipo', 'playlist')
            ->orderBy('pertenece_user.created_at', 'desc')
            ->get();

        $consultaAlbumes = (clone $contenedoresBaseQuery)
            ->where('contenedores.tipo', 'album')
            ->orderBy('pertenece_user.created_at', 'desc')
            ->get();

        $consultaEps = (clone $contenedoresBaseQuery)
            ->where('contenedores.tipo', 'ep')
            ->orderBy('pertenece_user.created_at', 'desc')
            ->get();

        $consultaSingles = (clone $contenedoresBaseQuery)
            ->where('contenedores.tipo', 'single')
            ->orderBy('pertenece_user.created_at', 'desc')
            ->get();


        if ($usuarioAuth) {
            $userPlaylists = $usuarioAuth->perteneceContenedores()
                ->where('tipo', 'playlist')
                ->with('canciones:id')
                ->select('id', 'nombre', 'imagen')
                ->get();

            $userPlaylists->each(function ($playlist) {
                if ($playlist->imagen && !filter_var($playlist->imagen, FILTER_VALIDATE_URL)) {
                    $playlist->imagen = Storage::disk('s3')->url($playlist->imagen);
                }
            });
        } else {
            $userPlaylists = collect();
        }

        return Inertia::render('Profile/Show', [
            'usuario' => $usuario->only(['id', 'name', 'email', 'foto_perfil', 'banner_perfil']),
            'cancionesUsuario' => $consultaCanciones,
            'playlistsUsuario' => $consultaPlaylists,
            'albumesUsuario' => $consultaAlbumes,
            'epsUsuario' => $consultaEps,
            'singlesUsuario' => $consultaSingles,
            'es_creador' => $esCreador,
            'seguidores' => $seguidores,
            'seguidos' => $seguidos,
            'auth' => [
                'user' => $usuarioAuth ? [
                    'id' => $usuarioAuth->id,
                    'name' => $usuarioAuth->name,
                    'playlists' => $userPlaylists,
                ] : null,
            ],
            'seguidores_count' => $usuario->seguidores()->count(),
            'seguidos_count' => $usuario->seguidos()->count(),
            'is_following' => $usuarioAuth ? $usuarioAuth->seguidos->contains($usuario->id) : false,
        ]);
    }


    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'auth' => [
                'user' => $request->user()->only(['id', 'name', 'email', 'foto_perfil', 'banner_perfil']),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $usuario = $request->user();

        $datosValidados = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:' . User::class . ',email,' . $usuario->id],
            'foto_perfil' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048'],
            'banner_perfil' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:4096'],
        ]);

        $usuario->fill($datosValidados);

        if ($request->hasFile('foto_perfil')) {
            $nombreBucket = config('filesystems.disks.s3.bucket');
            $claveS3Antigua = $usuario->foto_perfil ? obtenerClaveS3DesdeUrl($usuario->foto_perfil, $nombreBucket) : null;

            if ($claveS3Antigua && Storage::disk('s3')->exists($claveS3Antigua)) {
                Storage::disk('s3')->delete($claveS3Antigua);
            }

            $archivoFoto = $request->file('foto_perfil');
            $nombreFoto = Str::uuid() . '_perfil.' . $archivoFoto->getClientOriginalExtension();
            $rutaFoto = Storage::disk('s3')->putFileAs('perfiles/fotos', $archivoFoto, $nombreFoto, 'public-read');

            if ($rutaFoto) {
                 $usuario->foto_perfil = Storage::disk('s3')->url($rutaFoto);
            } else {
                return redirect()->back()
                    ->withErrors(['foto_perfil' => 'No se pudo subir la foto de perfil al bucket S3.'])
                    ->withInput();
            }
        }

        if ($request->hasFile('banner_perfil')) {
            $nombreBucket = config('filesystems.disks.s3.bucket');
            $claveS3Antigua = $usuario->banner_perfil ? obtenerClaveS3DesdeUrl($usuario->banner_perfil, $nombreBucket) : null;

            if ($claveS3Antigua && Storage::disk('s3')->exists($claveS3Antigua)) {
                Storage::disk('s3')->delete($claveS3Antigua);
            }

            $archivoBanner = $request->file('banner_perfil');
            $nombreBanner = Str::uuid() . '_banner.' . $archivoBanner->getClientOriginalExtension();
            $rutaBanner = Storage::disk('s3')->putFileAs('perfiles/banners', $archivoBanner, $nombreBanner, 'public-read');

             if ($rutaBanner) {
                $usuario->banner_perfil = Storage::disk('s3')->url($rutaBanner);
            } else {
                return redirect()->back()
                    ->withErrors(['banner_perfil' => 'No se pudo subir el banner de perfil al bucket S3.'])
                    ->withInput();
            }
        }

        if ($usuario->isDirty('email') && $usuario instanceof MustVerifyEmail) {
            $usuario->email_verified_at = null;
        }

        $usuario->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $usuario = $request->user();

        $rutaFotoPerfil = $usuario->foto_perfil;
        $rutaBanner = $usuario->banner_perfil;

        $nombreBucket = config('filesystems.disks.s3.bucket');
        $claveFotoPerfil = $rutaFotoPerfil ? obtenerClaveS3DesdeUrl($rutaFotoPerfil, $nombreBucket) : null;
        $claveBanner = $rutaBanner ? obtenerClaveS3DesdeUrl($rutaBanner, $nombreBucket) : null;


        Auth::logout();

        $usuario->delete();

        if ($claveFotoPerfil && Storage::disk('s3')->exists($claveFotoPerfil)) {
             Storage::disk('s3')->delete($claveFotoPerfil);
        }
        if ($claveBanner && Storage::disk('s3')->exists($claveBanner)) {
             Storage::disk('s3')->delete($claveBanner);
        }


        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    public function searchUsers(Request $request)
    {
        $termino = $request->input('q', '');
        $limite = 10;

        if (empty($termino)) {
            return response()->json([]);
        }

        $consulta = User::query()
            ->where(function ($q) use ($termino) {
                $q->where('name', 'LIKE', "%{$termino}%")
                    ->orWhere('email', 'LIKE', "%{$termino}%");
            })
            ->select('id', 'name', 'email', 'foto_perfil')
            ->limit($limite);

        if (Auth::check()) {
            $consulta->where('id', '!=', Auth::id());
        }

        $usuarios = $consulta->get();

        return response()->json($usuarios);
    }

        private function getLoopZUsuario($user): array
    {
        if (!$user) {
            return [];
        }
        $loopzPlaylist = $user->perteneceContenedores()
                                ->where('tipo', 'loopz')
                                ->first();

        if (!$loopzPlaylist) {
            return [];
        }

        return DB::table('cancion_contenedor')
               ->where('contenedor_id', $loopzPlaylist->id)
               ->pluck('cancion_id')
               ->all();
    }

    public function seguirUsuario(Request $request, $id)
    {
        $usuarioSeguir = User::findOrFail($id);
        $usuarioSeguidor = $request->user();

        if ($usuarioSeguidor->id === $usuarioSeguir->id) {
            return Redirect::back()->with('error', 'No puedes seguirte a ti mismo');
        }

        // Verificar correctamente usando wherePivot
        $siguiendo = $usuarioSeguidor->seguidos()
            ->wherePivot('user_id', $usuarioSeguir->id)
            ->exists();

        if ($siguiendo) {
            $usuarioSeguidor->seguidos()->detach($usuarioSeguir->id);
        } else {
            $usuarioSeguidor->seguidos()->attach($usuarioSeguir->id);
        }

        return Redirect::back();
    }
}
