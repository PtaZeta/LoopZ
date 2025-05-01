<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cancion extends Model
{
    /** @use HasFactory<\Database\Factories\CancionFactory> */
    use HasFactory;

    protected $table = 'canciones';

    protected $fillable = [
        'titulo',
        'genero',
        'duracion',
        'licencia',
        'foto_url',
        'archivo_url',
        'publico',
    ];

    public function contenedores()
    {
        return $this->belongsToMany(Contenedor::class, 'cancion_contenedor', 'cancion_id', 'contenedor_id')
                    ->withPivot('id')
                    ->withTimestamps();
    }

    public function usuarios()
    {
        return $this->morphToMany(User::class, 'perteneceable', 'pertenece_user');
    }

    public function loopz()
    {
        return $this->belongsToMany(User::class, 'loopzs_canciones', 'cancion_id', 'user_id')
                    ->withPivot('id')
                    ->withTimestamps();
    }
}
