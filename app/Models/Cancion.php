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

    public function pertenecePlaylists()
    {
        return $this->morphedByMany(Playlist::class, 'perteneceable', 'pertenece_cancion');
    }

    public function perteneceAlbumes()
    {
        return $this->morphedByMany(Album::class, 'perteneceable', 'pertenece_cancion');
    }

    public function perteneceEps()
    {
        return $this->morphedByMany(Ep::class, 'perteneceable', 'pertenece_cancion');
    }

    public function usuarios()
    {
        return $this->morphToMany(User::class, 'perteneceable', 'pertenece_user');
    }


}
