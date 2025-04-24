<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contenedor extends Model
{
    /** @use HasFactory<\Database\Factories\ContenedorFactory> */
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
        'publico',
    ];

    protected $table = 'contenedores';
}
