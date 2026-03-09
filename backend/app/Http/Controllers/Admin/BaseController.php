<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

abstract class BaseController extends Controller
{
    /**
     * Apply tenant scoping to a query unless super_admin.
     */
    protected function applyTenantScope(Builder $query): Builder
    {
        $user = auth()->user();
        if (! $user) {
            return $query;
        }
        if ($user->effective_role === 'super_admin' || $user->hasRole(\App\Models\Role::SLUG_SUPER_ADMIN)) {
            return $query;
        }
        $tid = $user->tenant_id ?? $user->agency_id;
        return $tid ? $query->where('tenant_id', $tid) : $query;
    }

    /**
     * Get tenant ID for the current user (null for super_admin).
     */
    protected function getTenantId(Request $request): ?int
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }
        if ($user->effective_role === 'super_admin' || $user->hasRole(\App\Models\Role::SLUG_SUPER_ADMIN)) {
            return null;
        }
        return $user->tenant_id ?? $user->agency_id;
    }
}
