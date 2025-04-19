<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Single extends Model
{
    /** @use HasFactory<\Database\Factories\SingleFactory> */
    use HasFactory;
    protected $fillable = [
        'nombre',
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
        return $this->morphToMany(Cancion::class, 'perteneceable', 'pertenece_cancion')
                    ->withPivot('id')
                    ->withTimestamps();
    }
}
