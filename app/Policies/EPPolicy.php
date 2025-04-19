<?php

namespace App\Policies;

use App\Models\EP;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EPPolicy
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
    public function view(User $user, EP $ep): bool
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
    public function edit(User $user, EP $ep): bool
    {
        return $ep->usuarios->contains($user);
        //return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, EP $ep): bool
    {
        return $ep->usuarios->contains($user);
        //return true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, EP $ep): bool
    {
        return $ep->usuarios->contains($user);
        //return true;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, EP $ep): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, EP $ep): bool
    {
        return false;
    }
}
