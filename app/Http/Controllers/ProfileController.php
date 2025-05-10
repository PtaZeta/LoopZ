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

class ProfileController extends Controller
{
    public function show(Request $request, $id): Response
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

        return Inertia::render('Profile/Show', [
            'cancionesUsuario' => $consultaCanciones,
            'playlistsUsuario' => $consultaPlaylists,
            'albumesUsuario' => $consultaAlbumes,
            'epsUsuario' => $consultaEps,
            'singlesUsuario' => $consultaSingles,
            'auth' => [
                'user' => $usuario->only(['id', 'name', 'email', 'foto_perfil', 'banner_perfil']),
            ],
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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:'.User::class.',email,'.$usuario->id],
            'foto_perfil' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048'],
            'banner_perfil' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:4096'],
        ]);

        $usuario->fill($datosValidados);

        if ($request->hasFile('foto_perfil')) {
            if ($usuario->foto_perfil && Storage::disk('public')->exists($usuario->foto_perfil)) {
                Storage::disk('public')->delete($usuario->foto_perfil);
            }
            $rutaFoto = $request->file('foto_perfil')->store('foto_perfil', 'public');
            $usuario->foto_perfil = $rutaFoto;
        }

        if ($request->hasFile('banner_perfil')) {
            if ($usuario->banner_perfil && Storage::disk('public')->exists($usuario->banner_perfil)) {
                Storage::disk('public')->delete($usuario->banner_perfil);
            }
            $rutaBanner = $request->file('banner_perfil')->store('banner_perfil', 'public');
            $usuario->banner_perfil = $rutaBanner;
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

        Auth::logout();

        $usuario->delete();

        if ($rutaFotoPerfil && Storage::disk('public')->exists($rutaFotoPerfil)) {
            Storage::disk('public')->delete($rutaFotoPerfil);
        }
        if ($rutaBanner && Storage::disk('public')->exists($rutaBanner)) {
            Storage::disk('public')->delete($rutaBanner);
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
            ->where(function($q) use ($termino) {
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
