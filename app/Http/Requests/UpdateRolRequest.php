<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRolRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rolId = $this->route('rol') ? $this->route('rol')->id : null;

        return [
            'nombre' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'nombre')->ignore($rolId),
            ],
        ];

    }
}
