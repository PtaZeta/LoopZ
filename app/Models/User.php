<?php

namespace App\Models;

// Si vas a usar la verificación de email, descomenta esta línea:
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// Asegúrate de que el modelo Cancion está importado si está en otro namespace
// use App\Models\Cancion;

// Si usas MustVerifyEmail, añade 'implements MustVerifyEmail' abajo
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * Los atributos que se pueden asignar masivamente usando User::create() o $user->fill().
     *
     * @var array<int, string> // tipo de array actualizado
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'foto_perfil',   
        'banner_perfil',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * Atributos que no se incluirán cuando el modelo se convierta a array o JSON.
     *
     * @var array<int, string> // tipo de array actualizado
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * Define cómo ciertos atributos deben ser convertidos a tipos de datos nativos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',         
        ];
    }

    /**
     * Define la relación muchos a muchos con Cancion.
     * Asume que existe un modelo App\Models\Cancion y una tabla pivote 'cancion_user'.
     */
    public function canciones()
    {
        return $this->belongsToMany(Cancion::class, 'cancion_user');
    }
}