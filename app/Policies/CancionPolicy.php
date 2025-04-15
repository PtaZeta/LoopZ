<?php

namespace App\Policies;

use App\Models\Cancion;
use App\Models\User;

class CancionPolicy
{
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Cancion $cancion): bool
    {
        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Cancion $cancion): bool
    {
        return $cancion->usuarios->contains($user);
    }

    public function delete(User $user, Cancion $cancion): bool
    {
        return $cancion->usuarios->contains($user);
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
