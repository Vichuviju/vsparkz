<?php

namespace App\Http\Middleware;

use App\Support\CorsOrigins;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure CORS headers are sent for API requests (preflight and actual).
 * Runs early so preflight OPTIONS always gets headers even if other middleware fails.
 */
class AddCorsHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $path = trim($request->path(), '/');
        $isApi = $path === 'api' || str_starts_with($path, 'api/');
        $isSanctum = $path === 'sanctum' || str_starts_with($path, 'sanctum/');
        if (! $isApi && ! $isSanctum) {
            return $next($request);
        }

        $origin = $request->headers->get('Origin');
        $allowedOrigin = CorsOrigins::resolve($origin);

        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
                ->header('Access-Control-Max-Age', '86400')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}
