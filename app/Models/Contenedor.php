<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Contenedor extends Model
{
    /** @use HasFactory<\Database\Factories\ContenedorFactory> */
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
        'publico',
        'tipo',
    ];

    protected $table = 'contenedores';

    public function obtenerUrlImagen()
    {
        return $this->imagen
            ? Storage::disk('public')->url($this->imagen)
            : null;
    }

    public function canciones()
    {
        return $this->belongsToMany(Cancion::class, 'cancion_contenedor', 'contenedor_id', 'cancion_id')
                    ->withPivot('id')
                    ->withTimestamps();
    }

    public function usuarios()
    {
        return $this->morphToMany(User::class, 'perteneceable', 'pertenece_user');
    }

    public function loopzusuarios()
    {
        return $this->belongsToMany(User::class, 'loopzs_contenedores', 'contenedor_id', 'user_id');
    }

    public function loopzcanciones()
    {
        return $this->belongsToMany(Cancion::class, 'loopzs_canciones', 'contenedor_id', 'cancion_id');
    }
}
