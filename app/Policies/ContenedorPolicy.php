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
        return $user && method_exists($contenedor, 'usuarios') && $contenedor->usuarios->contains($user);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Contenedor $contenedor): bool
    {
        return method_exists($contenedor, 'usuarios') && $contenedor->usuarios->contains($user);
    }

    public function delete(User $user, Contenedor $contenedor): bool
    {
        return method_exists($contenedor, 'usuarios') && $contenedor->usuarios->contains($user);
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
