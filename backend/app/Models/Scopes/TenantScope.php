<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $tenantId = $this->resolveTenantId();
        if ($tenantId === null) {
            return; // Super admin or no user: no filter
        }
        if (! \Schema::hasColumn($model->getTable(), 'tenant_id')) {
            return;
        }
        $builder->where($model->getTable() . '.tenant_id', $tenantId);
    }

    protected function resolveTenantId(): ?int
    {
        $user = auth()->user();
        if (! $user) {
            return null;
        }
        if ($user->isSuperAdmin()) {
            return request()->attributes->get('impersonate_tenant_id');
        }
        return $user->tenant_id;
    }
}
