<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Reglas existentes para nombre e email (sin cambios)
            'name' => [ 'string', 'max:255'],
            'email' => [
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id), // Ignora el email del usuario actual al verificar unicidad
            ],

            // --- Reglas añadidas para la foto de perfil y el banner ---
            'foto_perfil' => [
                'nullable', // Importante: Permite no enviar un archivo nuevo
                'image',    // Debe ser un archivo reconocido como imagen por Laravel
                'mimes:jpeg,png,jpg,gif,webp', // Extensiones/tipos MIME permitidos (ajústalos si necesitas otros)
                'max:2048', // Tamaño máximo en kilobytes (ej: 2MB). Ajusta según tus necesidades.
            ],
            'banner_perfil' => [
                'nullable', // Permite no enviar un archivo nuevo
                'image',    // Debe ser una imagen
                'mimes:jpeg,png,jpg,gif,webp', // Formatos permitidos
                'max:4096', // Tamaño máximo en kilobytes (ej: 4MB). Ajusta según tus necesidades.
            ],
            // --- Fin de reglas añadidas ---
        ];
    }

    /**
     * Opcional: Puedes personalizar los mensajes de error si lo deseas
     * definiendo un método messages()
     *
     * @return array<string, string>
     */
    // public function messages(): array
    // {
    //     return [
    //         'foto_perfil.image' => 'El archivo de perfil debe ser una imagen válida.',
    //         'foto_perfil.mimes' => 'La foto de perfil debe ser de tipo: :values.',
    //         'foto_perfil.max' => 'La foto de perfil no debe exceder los :max kilobytes.',
    //         // Mensajes similares para 'banner_perfil'
    //     ];
    // }
}