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
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'foto_perfil' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'banner_perfil' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        $rutaFotoPerfil = null;
        if ($request->hasFile('foto_perfil')) {
            $archivo = $request->file('foto_perfil');
            $nombre = Str::uuid() . '_perfil.' . $archivo->getClientOriginalExtension();
            $key = Storage::disk('s3')->putFileAs('perfiles/fotos', $archivo, $nombre, 'public-read');
            $rutaFotoPerfil = Storage::disk('s3')->url($key);
        }

        $rutaBannerPerfil = null;
        if ($request->hasFile('banner_perfil')) {
            $archivo = $request->file('banner_perfil');
            $nombre = Str::uuid() . '_banner.' . $archivo->getClientOriginalExtension();
            $key = Storage::disk('s3')->putFileAs('perfiles/banners', $archivo, $nombre, 'public-read');
            $rutaBannerPerfil = Storage::disk('s3')->url($key);
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

        (new User([
            'name' => $request->name,
            'email' => $request->email,
        ]))->notify(new CodigoVerificacionNotification($codigo));

        return redirect(route('verificacion.aviso', absolute: false));
    }
}
