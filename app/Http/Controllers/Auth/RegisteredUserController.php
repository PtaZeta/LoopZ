<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Contenedor;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'foto_perfil' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'banner_perfil' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        $rutaFotoPerfil = null;
        if ($request->hasFile('foto_perfil') && $request->file('foto_perfil')->isValid()) {
            $rutaFotoPerfil = $request->file('foto_perfil')->store('foto_perfil', 'public');
        }

        $rutaBannerPerfil = null;
        if ($request->hasFile('banner_perfil') && $request->file('banner_perfil')->isValid()) {
            $rutaBannerPerfil = $request->file('banner_perfil')->store('banner_perfil', 'public');
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'foto_perfil' => $rutaFotoPerfil,
            'banner_perfil' => $rutaBannerPerfil,
        ]);

        $playlist = Contenedor::create([
            'user_id' => $user->id,
            'nombre' => 'LoopZs',
            'descripcion' => '',
            'tipo' => 'loopz',
        ]);

        $playlist->usuarios()->attach($user->id, ['propietario' => true]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('welcome', absolute: false));
    }
}
