<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use App\Models\Contenedor;

class CodigoVerificacionController extends Controller
{
    public function verificarCodigoApi(Request $request)
    {
        $request->validate([
            'codigo' => ['required', 'string', 'digits:6'],
        ]);

        $registrationData = Session::get('registration_data');

        if (!$registrationData) {
            throw ValidationException::withMessages([
                'codigo' => 'No se encontraron datos de registro. Por favor, regístrate de nuevo.',
            ]);
        }

        if ($registrationData['codigo_verificacion'] !== $request->codigo) {
            throw ValidationException::withMessages([
                'codigo' => 'El código de verificación es incorrecto.',
            ]);
        }

        if (Carbon::now()->greaterThan($registrationData['codigo_verificacion_expira_en'])) {
            Session::forget('registration_data');
            throw ValidationException::withMessages([
                'codigo' => 'El código de verificación ha expirado. Por favor, regístrate de nuevo.',
            ]);
        }

        $user = User::create([
            'name' => $registrationData['name'],
            'email' => $registrationData['email'],
            'password' => $registrationData['password'],
            'foto_perfil' => $registrationData['foto_perfil'],
            'banner_perfil' => $registrationData['banner_perfil'],
            'email_verified_at' => now(), // Marca el email como verificado
        ]);

        $playlist = Contenedor::create([
            'user_id' => $user->id,
            'nombre' => 'LoopZs',
            'descripcion' => '',
            'tipo' => 'loopz',
        ]);

        $playlist->usuarios()->attach($user->id, ['propietario' => true]);

        Auth::login($user);

        Session::forget('registration_data');

       return response()->json(['message' => 'Código verificado con éxito. ¡Tu cuenta está activada!', 'redirect' => route('welcome', absolute: false)], 200);
    }
}
