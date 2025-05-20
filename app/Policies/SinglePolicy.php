<?php

namespace App\Policies;

use App\Models\Single;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SinglePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Single $single): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function edit(User $user, Single $single): bool
    {
        return $single->usuarios->contains($user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Single $single): bool
    {
        return $single->usuarios->contains($user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Single $single): bool
    {
        return $single->usuarios->contains($user);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Single $single): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Single $single): bool
    {
        return false;
    }
}
