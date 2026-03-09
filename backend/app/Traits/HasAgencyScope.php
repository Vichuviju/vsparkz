<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HasAgencyScope
{
    /**
     * Scope query to the authenticated user’s agency unless super_admin.
     * Usage: Model::forAgency()->get();
     */
    public function scopeForAgency(Builder $query): Builder
    {
        $user = auth()->user();
        if (!$user) {
            return $query; // no auth, return unfiltered (should not happen in admin)
        }

        // Super admin sees all
        if ($user->effective_role === 'super_admin' || $user->hasRole(\App\Models\Role::SLUG_SUPER_ADMIN)) {
            return $query;
        }

        // Agency users see only their agency
        return $query->where('agency_id', $user->agency_id);
    }
}
