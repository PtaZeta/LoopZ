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
use getID3; // Asumiendo que tienes getID3 configurado

// Helper para intentar obtener la clave de S3 desde una URL.
// ¡Nota: Esta es una implementación básica y puede necesitar ajustarse
// a la estructura exacta de tus URLs de S3 y no es robusta para todos los casos!
// La práctica estándar es almacenar la ruta (key) en la base de datos, no la URL completa.
function obtenerClaveS3DesdeUrl($url, $nombreBucket) {
    $urlParseada = parse_url($url);
    if ($urlParseada && isset($urlParseada['host']) && isset($urlParseada['path'])) {
        // Verifica si el host contiene el nombre del bucket
        if (strpos($urlParseada['host'], $nombreBucket) !== false) {
            // La ruta S3 es la parte 'path' sin el '/' inicial
            return ltrim($urlParseada['path'], '/');
        }
    }
    // Si no parece una URL de S3 esperada o falla el parseo, retorna el valor original
    // asumiendo que podría ser ya una clave/ruta
    return $url;
}


class ProfileController extends Controller
{
    public function show($id): Response
    {
        $usuario = User::findOrFail($id);

        $withUsuariosCallback = function ($query) {
            $query->select('users.id', 'users.name', 'users.foto_perfil');
        };

        $consultaCanciones = $usuario->perteneceCanciones()
            ->with(['usuarios' => $withUsuariosCallback])
            ->orderBy('pertenece_user.created_at', 'desc')
            ->limit(10)
            ->get();

        $consultaPlaylists = $usuario->perteneceContenedores()
            ->where('contenedores.tipo', 'playlist')
            ->with(['usuarios' => $withUsuariosCallback])
            ->orderBy('pertenece_user.created_at', 'desc')
            ->limit(10)
            ->get();

        $consultaAlbumes = $usuario->perteneceContenedores()
            ->where('contenedores.tipo', 'album')
            ->with(['usuarios' => $withUsuariosCallback])
            ->orderBy('pertenece_user.created_at', 'desc')
            ->limit(10)
            ->get();

        $consultaEps = $usuario->perteneceContenedores()
            ->where('contenedores.tipo', 'ep')
            ->with(['usuarios' => $withUsuariosCallback])
            ->orderBy('pertenece_user.created_at', 'desc')
            ->limit(10)
            ->get();

        $consultaSingles = $usuario->perteneceContenedores()
            ->where('contenedores.tipo', 'single')
            ->with(['usuarios' => $withUsuariosCallback])
            ->orderBy('pertenece_user.created_at', 'desc')
            ->limit(10)
            ->get();


        $esCreador = auth()->check() && auth()->user()->id === $usuario->id;
        return Inertia::render('Profile/Show', [
            'usuario' => $usuario->only(['id', 'name', 'email', 'foto_perfil', 'banner_perfil']),
            'cancionesUsuario' => $consultaCanciones,
            'playlistsUsuario' => $consultaPlaylists,
            'albumesUsuario' => $consultaAlbumes,
            'epsUsuario' => $consultaEps,
            'singlesUsuario' => $consultaSingles,
            'es_creador' => $esCreador,
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
                 $usuario->foto_perfil = Storage::disk('s3')->url($rutaFoto); // Guarda la URL completa
            } else {
                // Manejar error de subida si putFileAs devuelve false
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
                $usuario->banner_perfil = Storage::disk('s3')->url($rutaBanner); // Guarda la URL completa
            } else {
                 // Manejar error de subida
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

}
