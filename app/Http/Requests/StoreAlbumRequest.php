<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth; // Importa Auth si lo vas a usar

class StoreAlbumRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool // Asegúrate que el tipo de retorno sea bool
    {
        // Cambia esto:
        // return false;

        // A esto (para permitir la acción por ahora):
        return true;

        // --- Opcional: Implementar autorización real ---
        // Si solo los usuarios autenticados pueden crear playlists:
        // return Auth::check();
        // return $this->user() != null; // Otra forma de verificar si hay usuario

        // Si tienes roles/permisos (ejemplo con Spatie Permissions):
        // return $this->user()->can('create playlists');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        // Asegúrate que tus reglas de validación estén aquí
        return [
            'nombre' => 'required|string|max:255',
            'imagen' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:2048',
        ];
    }
}
