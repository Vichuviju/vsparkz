<?php

namespace App\Http\Controllers\Admin;

use App\Services\BrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandingController extends BaseController
{
    public function show(Request $request, BrandingService $branding): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId === null) {
            return response()->json(['data' => ['branding' => null, 'domains' => [], 'email_identities' => []]]);
        }
        $data = $branding->getBrandingForTenant($tenantId);
        return response()->json(['data' => $data]);
    }
}
