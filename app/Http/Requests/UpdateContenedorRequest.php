<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth; // Import Auth facade
use App\Models\Contenedor; // Import Contenedor model if using policies

class UpdateContenedorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Permitir si el usuario está autenticado.
        // Idealmente, deberías usar una Policy para verificar si el usuario
        // puede actualizar *este* contenedor específico.
        // Ejemplo con Policy (descomentar si tienes ContenedorPolicy):
        // $contenedor = $this->route('contenedor'); // Obtiene el contenedor de la ruta
        // return $contenedor && Auth::user()->can('update', $contenedor);

        return Auth::check(); // Permitir a cualquier usuario logueado por ahora
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'imagen_nueva' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'], // max:2048 = 2MB
            'eliminar_imagen' => ['nullable', 'boolean'],
            'publico' => ['nullable', 'boolean'],
            'userIds' => ['nullable', 'array'],
            'userIds.*' => ['integer', 'exists:users,id'],
        ];
    }

     /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del contenedor es obligatorio.',
            'nombre.max' => 'El nombre no puede exceder los 255 caracteres.',
            'descripcion.max' => 'La descripción no puede exceder los 1000 caracteres.',
            'imagen_nueva.image' => 'El archivo debe ser una imagen.',
            'imagen_nueva.mimes' => 'La imagen debe ser de tipo: jpeg, png, jpg, gif, webp.',
            'imagen_nueva.max' => 'La imagen no debe pesar más de 2MB.',
            'eliminar_imagen.boolean' => 'El campo para eliminar imagen debe ser verdadero o falso.',
            'publico.boolean' => 'El campo público debe ser verdadero o falso.',
            'userIds.array' => 'Los colaboradores deben ser proporcionados como una lista.',
            'userIds.*.integer' => 'Cada ID de colaborador debe ser un número entero.',
            'userIds.*.exists' => 'Uno o más IDs de colaborador no son válidos.',
        ];
    }
}
