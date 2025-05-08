<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Genero extends Model
{
    /** @use HasFactory<\Database\Factories\GeneroFactory> */
    use HasFactory;

    protected $fillable = ['nombre'];

    public function canciones()
    {
        return $this->belongsToMany(Cancion::class, 'cancion_genero', 'genero_id', 'cancion_id')
                    ->withPivot('id')
                    ->withTimestamps();
    }
}
