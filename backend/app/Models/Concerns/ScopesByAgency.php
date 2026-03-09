<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait ScopesByAgency
{
    /**
     * Scope the query to the current user's agency when not super_admin.
     * Super admin sees all; agency_admin/agency_staff see only their agency_id.
     */
    public function scopeForAgency(Builder $query): Builder
    {
        $user = auth()->user();
        if (! $user) {
            return $query->whereRaw('1 = 0');
        }
        if ($user->isSuperAdmin()) {
            return $query;
        }
        return $query->where($this->getTable() . '.agency_id', $user->agency_id);
    }
}
