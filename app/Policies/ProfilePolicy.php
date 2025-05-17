<?php

namespace App\Policies;

use App\Models\User;

class ProfilePolicy
{
    /**
     * Create a new policy instance.
     */
    public function view(User $user, User $profile): bool
    {
        return $profile->id === $user->id;
    }
}
