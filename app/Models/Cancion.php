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
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'cancion_user');
    }
}
