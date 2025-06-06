<?php

namespace App\Policies;

use App\Models\Contenedor;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ContenedorPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Contenedor $contenedor): bool
    {
        if ($contenedor->publico) {
            return true;
        }
        return $user && ($contenedor->usuarios->contains($user) || $user->roles()->where('nombre', 'Administrador')->exists());
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function edit(User $user, Contenedor $contenedor): bool
    {
        return $contenedor->usuarios->contains($user) || $user->roles()->where('nombre', 'Administrador')->exists();
    }

    public function update(User $user, Contenedor $contenedor): bool
    {
        return $contenedor->usuarios->contains($user) || $user->roles()->where('nombre', 'Administrador')->exists();
    }

    public function delete(User $user, Contenedor $contenedor): bool
    {
        return $contenedor->usuarios->contains($user) || $user->roles()->where('nombre', 'Administrador')->exists();
    }

    public function restore(User $user, Contenedor $contenedor): bool
    {
        return false;
    }

    public function forceDelete(User $user, Contenedor $contenedor): bool
    {
        return false;
    }
}
