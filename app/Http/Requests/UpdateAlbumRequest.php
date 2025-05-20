<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateAlbumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'publico' => 'required|boolean',
            'imagen_nueva' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'eliminar_imagen' => 'nullable|boolean',
        ];
    }

     public function messages(): array
     {
         return [
             'nombre.required' => 'El nombre del album es obligatorio.',
             'nombre.max' => 'El nombre no puede exceder los 255 caracteres.',
             'imagen_nueva.image' => 'El archivo subido debe ser una imagen.',
             'imagen_nueva.mimes' => 'La imagen debe ser de tipo: jpeg, png, jpg, gif, svg, webp.',
             'imagen_nueva.max' => 'La imagen no debe pesar más de 2MB.',
             'eliminar_imagen.boolean' => 'El indicador de eliminar imagen debe ser verdadero o falso.',
         ];
     }
}
