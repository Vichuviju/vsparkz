<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model): void {
            if (\Schema::hasColumn($model->getTable(), 'tenant_id') && $model->tenant_id === null) {
                $user = auth()->user();
                if ($user && ! $user->isSuperAdmin() && $user->tenant_id) {
                    $model->tenant_id = $user->tenant_id;
                }
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope the query to the current user's tenant when not super_admin.
     * Alias for when global scope is not applied (e.g. withoutGlobalScope).
     */
    public function scopeForTenant(Builder $query, ?int $tenantId = null): Builder
    {
        $user = auth()->user();
        if (! $user) {
            return $query->whereRaw('1 = 0');
        }
        if ($user->isSuperAdmin() && $tenantId === null) {
            return $query;
        }
        $id = $tenantId ?? $user->tenant_id;
        return $query->where($this->getTable() . '.tenant_id', $id);
    }

    /**
     * Alias for forTenant: scope by tenant_id (legacy name "forAgency" for controllers).
     */
    public function scopeForAgency(Builder $query): Builder
    {
        return $this->scopeForTenant($query, null);
    }
}
