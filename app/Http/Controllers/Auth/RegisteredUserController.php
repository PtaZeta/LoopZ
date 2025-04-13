<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage; // <-- Importar Storage
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
        // 1. Validación (incluyendo los nuevos campos de archivo)
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            // Validar 'foto_perfil' si se envía: debe ser imagen, tipos permitidos, tamaño máximo (ej: 2MB)
            'foto_perfil' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            // Validar 'banner_perfil' si se envía: debe ser imagen, tipos permitidos, tamaño máximo (ej: 4MB)
            'banner_perfil' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        // 2. Procesar y almacenar archivos (si existen)
        $rutaFotoPerfil = null;
        if ($request->hasFile('foto_perfil') && $request->file('foto_perfil')->isValid()) {
            // Guarda el archivo en 'storage/app/public/fotos_perfil' y obtiene la ruta
            // 'store' genera un nombre único para evitar colisiones
            $rutaFotoPerfil = $request->file('foto_perfil')->store('foto_perfil', 'public');
        }

        $rutaBannerPerfil = null;
        if ($request->hasFile('banner_perfil') && $request->file('banner_perfil')->isValid()) {
            $rutaBannerPerfil = $request->file('banner_perfil')->store('banner_perfil', 'public');
        }

        // 3. Crear el usuario con todos los datos (incluyendo las rutas de archivo)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'foto_perfil' => $rutaFotoPerfil,     // Guardar la ruta o null
            'banner_perfil' => $rutaBannerPerfil, // Guardar la ruta o null
        ]);

        // Disparar evento, iniciar sesión y redirigir (sin cambios aquí)
        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}