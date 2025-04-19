<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
// If your Playlist model is in App\Models:
// use App\Models\Playlist;

class UpdateAlbumRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * This assumes you have a 'album' route parameter bound to the Album model
     * and that your Album model has a 'user_id' attribute.
     * It checks if the currently authenticated user owns the album they are trying to update.
     */
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'eliminar_imagen' => 'nullable|boolean',
        ];
    }

    public function messages(): array
     {
         return [
             'nombre.required' => 'El nombre de la playlist es obligatorio.',
             'nombre.max' => 'El nombre no puede exceder los 255 caracteres.',
             'imagen.image' => 'El archivo subido debe ser una imagen.',
             'imagen.mimes' => 'La imagen debe ser de tipo: jpeg, png, jpg, gif, svg, webp.',
             'imagen.max' => 'La imagen no debe pesar más de 2MB.',
             'eliminar_imagen.boolean' => 'El indicador de eliminar imagen debe ser verdadero o falso.',
         ];
     }
}
