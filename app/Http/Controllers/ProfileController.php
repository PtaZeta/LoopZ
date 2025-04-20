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

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $cancionesQuery = $user->perteneceCanciones()
                               ->orderBy('created_at', 'desc');

        $canciones = $cancionesQuery->get();

        $playlistsQuery = $user->pertenecePlaylists()
                               ->orderBy('created_at', 'desc');

        $playlists = $playlistsQuery->get();

        $albumesQuery = $user->perteneceAlbumes()
                               ->orderBy('created_at', 'desc');

        $albumes = $albumesQuery->get();

        $epsQuery = $user->perteneceEps()
                               ->orderBy('created_at', 'desc');

        $eps = $epsQuery->get();

        $singlesQuery = $user->perteneceSingles()
                               ->orderBy('created_at', 'desc');

        $singles = $singlesQuery->get();

        return Inertia::render('Profile/Index', [
            'cancionesUsuario' => $canciones,
            'playlistsUsuario' => $playlists,
            'albumesUsuario' => $albumes,
            'epsUsuario' => $eps,
            'singlesUsuario' => $singles,
        ]);
    }

    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'foto_perfil' => 'nullable|image|max:2048',
            'banner_perfil' => 'nullable|image|max:4096',
        ]);

        $user->name = $validatedData['name'];
        $user->email = $validatedData['email'];

        if ($request->hasFile('foto_perfil')) {
            if ($user->foto_perfil && Storage::disk('public')->exists($user->foto_perfil)) {
                Storage::disk('public')->delete($user->foto_perfil);
            }
            $path = $request->file('foto_perfil')->store('foto_perfil', 'public');
            $user->foto_perfil = $path;
        }

        if ($request->hasFile('banner_perfil')) {
            if ($user->banner_perfil && Storage::disk('public')->exists($user->banner_perfil)) {
                Storage::disk('public')->delete($user->banner_perfil);
            }
            $path = $request->file('banner_perfil')->store('banner_perfil', 'public');
            $user->banner_perfil = $path;
        }

        if ($user->isDirty('email') && $user instanceof MustVerifyEmail) {
            $user->email_verified_at = null;
        }

        $user->save();

        return back()->with('status', 'profile-updated');
    }


    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $rutaFotoPerfil = $user->foto_perfil;
        $rutaBanner = $user->banner_perfil;

        Auth::logout();

        // $user->perteneceCanciones()->detach();
        $user->delete();

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
}
