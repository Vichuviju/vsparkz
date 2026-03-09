<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Optional: Check tenant plan limits before allowing create actions.
 * Controllers can also enforce inline; this middleware is for route-level guard.
 * Does not block by default; use in routes that create clients/projects/users.
 */
class CheckPlanLimits
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }
}
