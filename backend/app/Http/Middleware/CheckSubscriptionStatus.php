<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Block access for tenant users when subscription is expired.
 * Super admin bypasses. Optional override on tenant (e.g. allow_override_lock) can be added.
 */
class CheckSubscriptionStatus
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }
        if ($user->isSuperAdmin()) {
            return $next($request);
        }
        $tenantId = $user->tenant_id ?? $request->attributes->get('tenant_id');
        if (! $tenantId) {
            return $next($request);
        }
        $tenant = Tenant::find($tenantId);
        if (! $tenant) {
            return $next($request);
        }
        if ($tenant->status === Tenant::STATUS_EXPIRED) {
            return response()->json([
                'message' => 'Subscription Expired — Please Renew',
                'code' => 'subscription_expired',
            ], 403);
        }
        if ($tenant->status === Tenant::STATUS_SUSPENDED) {
            return response()->json([
                'message' => 'Account suspended. Please contact support.',
                'code' => 'tenant_suspended',
            ], 403);
        }
        return $next($request);
    }
}
