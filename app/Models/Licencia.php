<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Licencia extends Model
{
    /** @use HasFactory<\Database\Factories\LicenciaFactory> */
    use HasFactory;

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'url',
        'requiere_atribucion',
        'es_dominio_publico',
    ];

        public function canciones()
        {
            return $this->hasMany(Cancion::class, 'licencia_id');
        }
}
