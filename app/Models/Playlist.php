<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Playlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
    ];

    protected $appends = ['imagen_url'];

    public function getImagenUrlAttribute()
    {
        return $this->imagen
            ? Storage::disk('public')->url($this->imagen)
            : null;
    }

    public function usuarios()
    {
        return $this->morphToMany(User::class, 'perteneceable', 'pertenece_user');
    }
    public function canciones()
    {
        return $this->morphToMany(Cancion::class, 'perteneceable', 'pertenece_user');
    }
}
