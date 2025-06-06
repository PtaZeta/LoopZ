<?php

namespace App\Policies;

use App\Models\Cancion;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CancionPolicy
{
    use HandlesAuthorization;

    public function viewAny(?User $user): bool
    {
        return false;
    }

    public function view(?User $user, Cancion $cancion): bool
    {
        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function edit(User $user, Cancion $cancion): bool
    {
        return $cancion->usuarios->contains($user) || $user->roles()->where('nombre', 'Administrador')->exists();
    }

    public function update(User $user, Cancion $cancion): bool
    {
        return $cancion->usuarios->contains($user) || $user->roles()->where('nombre', 'Administrador')->exists();
    }

    public function delete(User $user, Cancion $cancion): bool
    {
        return $cancion->usuarios->contains($user) || $user->roles()->where('nombre', 'Administrador')->exists();
    }

    public function restore(User $user, Cancion $cancion): bool
    {
        return false;
    }

    public function forceDelete(User $user, Cancion $cancion): bool
    {
        return false;
    }
}
