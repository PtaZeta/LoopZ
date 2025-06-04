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
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Notifications\CodigoVerificacionNotification;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

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

        $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiraEn = Carbon::now()->addMinutes(10);

        Session::put('registration_data', [
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'foto_perfil' => $rutaFotoPerfil,
            'banner_perfil' => $rutaBannerPerfil,
            'codigo_verificacion' => $codigo,
            'codigo_verificacion_expira_en' => $expiraEn,
        ]);

        $user = (object) Session::get('registration_data');
        $user->name = $request->name;
        $user->email = $request->email;
        $user->password = Hash::make($request->password);
        $user->codigo_verificacion = $codigo;
        $user->codigo_verificacion_expira_en = $expiraEn;

        (new User([
            'name' => $request->name,
            'email' => $request->email,
        ]))->notify(new CodigoVerificacionNotification($codigo));

        return redirect(route('verificacion.aviso', absolute: false));
    }
}
