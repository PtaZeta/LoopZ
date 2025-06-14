<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreContenedorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
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
            'imagen' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'publico' => ['nullable', 'boolean'],
            'tipo' => ['required', 'string', Rule::in(['album', 'ep', 'single', 'playlist'])],
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
            'imagen.image' => 'El archivo debe ser una imagen.',
            'imagen.mimes' => 'La imagen debe ser de tipo: jpeg, png, jpg, gif, webp.',
            'imagen.max' => 'La imagen no debe pesar más de 2MB.',
            'publico.boolean' => 'El campo público debe ser verdadero o falso.',
            'userIds.array' => 'Los colaboradores deben ser proporcionados como una lista.',
            'userIds.*.integer' => 'Cada ID de colaborador debe ser un número entero.',
            'userIds.*.exists' => 'Uno o más IDs de colaborador no son válidos.',
        ];
    }
}
