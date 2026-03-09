<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = null;
        $tenant = null;

        if ($request->user()) {
            $tenantId = $request->attributes->get('impersonate_tenant_id') ?? $request->user()->tenant_id;
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
            }
        } else {
            $tenantId = $this->resolveTenantFromRequest($request);
            if ($tenantId) {
                $tenant = Tenant::where('id', $tenantId)->where('status', 'active')->first();
            }
        }

        $request->attributes->set('tenant_id', $tenantId);
        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }

    protected function resolveTenantFromRequest(Request $request): ?int
    {
        $slug = $request->header('X-Tenant');
        if ($slug) {
            $t = Tenant::where('slug', $slug)->where('status', 'active')->first();
            return $t?->id;
        }
        $host = $request->getHost();
        if (preg_match('/^([a-z0-9-]+)\./', $host, $m)) {
            $subdomain = $m[1];
            if (! in_array($subdomain, ['www', 'api', 'admin'], true)) {
                $t = Tenant::where('slug', $subdomain)->where('status', 'active')->first();
                return $t?->id;
            }
        }
        $defaultId = config('app.default_tenant_id');
        return $defaultId ? (int) $defaultId : null;
    }
}
