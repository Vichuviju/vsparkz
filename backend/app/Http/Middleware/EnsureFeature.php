<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure the current tenant has the given feature enabled.
 * Usage: ->middleware('feature:crm')
 * Super admin bypasses.
 */
class EnsureFeature
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }
        if ($user->isSuperAdmin()) {
            return $next($request);
        }
        $tenant = $request->attributes->get('tenant') ?? Tenant::find($user->tenant_id ?? $user->agency_id);
        if (! $tenant) {
            return $next($request);
        }
        if (! $tenant->hasFeature($feature)) {
            return response()->json([
                'message' => 'This feature is not available on your plan.',
                'code' => 'feature_disabled',
            ], 403);
        }
        return $next($request);
    }
}
