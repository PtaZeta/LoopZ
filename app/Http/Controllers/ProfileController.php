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

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Profile/Index');
    }

    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'foto_perfil' => 'nullable|image|max:2048',
            'banner_perfil' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('foto_perfil')) {
            // Elimina la foto anterior si existe
            if ($user->foto_perfil) {
                Storage::disk('public')->delete($user->foto_perfil);
            }

            // Guarda en storage/app/public/foto_perfil/
            $path = $request->file('foto_perfil')->store('foto_perfil', 'public');
            $user->foto_perfil = $path;
        }

        if ($request->hasFile('banner_perfil')) {
            if ($user->banner_perfil) {
                Storage::disk('public')->delete($user->banner_perfil);
            }

            // Guarda en storage/app/public/banner_perfil/
            $path = $request->file('banner_perfil')->store('banner_perfil', 'public');
            $user->banner_perfil = $path;
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        return back()->with('status', 'profile-updated');
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

        if ($rutaFotoPerfil) {
            Storage::disk('public')->delete($rutaFotoPerfil);
        }
        if ($rutaBanner) {
            Storage::disk('public')->delete($rutaBanner);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}