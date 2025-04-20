<?php
// app/Http/Requests/UpdateAlbumRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateAlbumRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Basic check: allow if logged in. Replace with policy if needed.
        return Auth::check();
        // Example policy check:
        // $album = $this->route('album');
        // return $this->user()->can('update', $album);
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'publico' => 'required|boolean',
            'imagen_nueva' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'eliminar_imagen' => 'nullable|boolean',
            'userIds' => 'nullable|array',
            'userIds.*' => 'integer|exists:users,id',
        ];
    }

    public function attributes(): array
    {
        return [
            'nombre' => 'nombre del album',
            'publico' => 'visibilidad',
            'imagen_nueva' => 'nueva imagen de portada',
            'eliminar_imagen' => 'eliminar imagen actual',
            'userIds' => 'usuarios asociados',
            'userIds.*' => 'usuario asociado',
        ];
    }

     public function messages(): array
     {
         return [
             'nombre.required' => 'El nombre del album es obligatorio.',
             'nombre.max' => 'El nombre no puede exceder los 255 caracteres.',
             'publico.required' => 'Debe indicar si el album es público o privado.',
             'publico.boolean' => 'El valor de visibilidad no es válido.',
             'imagen_nueva.image' => 'El archivo subido debe ser una imagen.',
             'imagen_nueva.mimes' => 'La imagen debe ser de tipo: jpeg, png, jpg, gif, svg, webp.',
             'imagen_nueva.max' => 'La imagen no debe pesar más de 2MB.',
             'eliminar_imagen.boolean' => 'El indicador de eliminar imagen debe ser verdadero o falso.',
             'userIds.array' => 'La lista de usuarios debe ser un arreglo.',
             'userIds.*.integer' => 'Cada ID de usuario debe ser un número entero.',
             'userIds.*.exists' => 'Uno de los usuarios seleccionados no existe.',
         ];
     }
}
