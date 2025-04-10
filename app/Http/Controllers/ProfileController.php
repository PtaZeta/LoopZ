<?php

namespace App\Http\Controllers;

// Asegúrate de que ProfileUpdateRequest está correctamente importado
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage; // <-- Importar Storage
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log; // <-- Importar Log

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            // No es necesario pasar el usuario aquí explícitamente,
            // Inertia lo comparte globalmente via 'auth.user'
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        // --- CONSOLE.LOG / DEBUG de las imágenes NADA MÁS ENTRAR ---
        Log::debug('================================================');
        Log::debug('ProfileController@update starting.');
        Log::debug('--- Checking File Inputs ---');
        Log::debug('Request has file "foto_perfil"? : ' . ($request->hasFile('foto_perfil') ? 'YES' : 'NO'));
        Log::debug('Request has file "banner_perfil"? : ' . ($request->hasFile('banner_perfil') ? 'YES' : 'NO'));
        Log::debug('Request Files Array ($request->allFiles()): ', $request->allFiles()); // Muestra estructura de archivos recibidos
        // Opcional: Ver todos los inputs (útil si no estás seguro qué llega)
        // Log::debug('Request All Input ($request->all()): ', $request->all());
        Log::debug('================================================');
        // --- FIN DEBUG INICIAL ---


        $user = $request->user();

        // --- Procesamiento (con los logs que ya tenías) ---
        // Manejo de la Foto de Perfil
        if ($request->hasFile('foto_perfil')) { // Ya hemos logueado esto arriba, pero el if es necesario
            if ($request->file('foto_perfil')->isValid()) {
                Log::debug('"foto_perfil" is valid. Processing...');
                // ... (resto del bloque try-catch para foto_perfil) ...
                 $oldPath = $user->foto_perfil;
                 Log::debug('Old foto_perfil path: ' . ($oldPath ?? 'null'));
                 try {
                     $newPath = $request->file('foto_perfil')->store('fotos_perfil', 'public');
                     Log::debug('New foto_perfil path stored: ' . $newPath);
                     $user->foto_perfil = $newPath;
                     if ($oldPath) {
                         Log::debug('Attempting to delete old foto_perfil: ' . $oldPath);
                         Storage::disk('public')->delete($oldPath);
                     }
                 } catch (\Exception $e) {
                     Log::error('Error storing/deleting foto_perfil: ' . $e->getMessage());
                 }
            } else {
                Log::warning('"foto_perfil" file is not valid.');
            }
        } // else ya logueado arriba

        // Manejo del Banner
         if ($request->hasFile('banner_perfil')) { // Ya hemos logueado esto arriba
             if ($request->file('banner_perfil')->isValid()) {
                Log::debug('"banner_perfil" is valid. Processing...');
                 // ... (resto del bloque try-catch para banner_perfil) ...
                  $oldPath = $user->banner_perfil;
                  Log::debug('Old banner_perfil path: ' . ($oldPath ?? 'null'));
                  try {
                      $newPath = $request->file('banner_perfil')->store('banners_perfil', 'public');
                      Log::debug('New banner_perfil path stored: ' . $newPath);
                      $user->banner_perfil = $newPath;
                      if ($oldPath) {
                          Log::debug('Attempting to delete old banner_perfil: ' . $oldPath);
                          Storage::disk('public')->delete($oldPath);
                      }
                  } catch (\Exception $e) {
                      Log::error('Error storing/deleting banner_perfil: ' . $e->getMessage());
                  }
             } else {
                  Log::warning('"banner_perfil" file is not valid.');
             }
         } // else ya logueado arriba


        // --- DEBUG: Antes de guardar ---
        Log::debug('Attempting to fill user with validated data (name/email).');
        $user->fill($request->validated());
        Log::debug('User data before save (dirty): ', $user->getDirty());

        if ($user->isDirty('email')) {
            Log::debug('Email is dirty, resetting verification.');
            $user->email_verified_at = null;
        }

        try {
            $user->save();
            Log::debug('User saved successfully.');
        } catch (\Exception $e) {
             Log::error('Error saving user model: ' . $e->getMessage());
        }

        Log::debug('Redirecting back to profile.edit.');
        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }



    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $profilePhotoPath = $user->foto_perfil;
        $bannerPath = $user->banner_perfil;

        Auth::logout();

        $user->delete(); // Borra DB record

        // Borra archivos después de borrar usuario
        if ($profilePhotoPath) {
            Storage::disk('public')->delete($profilePhotoPath);
        }
        if ($bannerPath) {
            Storage::disk('public')->delete($bannerPath);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}