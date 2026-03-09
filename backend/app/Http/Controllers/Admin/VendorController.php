<?php

namespace App\Http\Controllers\Admin;

use App\Models\Vendor;
use App\Services\VendorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorController extends BaseController
{
    public function __construct(
        protected VendorService $vendorService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $items = $this->vendorService->listVendors($tenantId);
        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:100',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);
        $vendor = $this->vendorService->createVendor($validated, $this->getTenantId($request));
        return response()->json(['data' => $vendor], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Vendor::where('id', $id);
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $vendor = $query->firstOrFail();
        $vendor->load(['rateCards', 'contracts']);
        return response()->json(['data' => $vendor]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Vendor::where('id', $id);
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $vendor = $query->firstOrFail();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'nullable|string|max:100',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);
        $vendor = $this->vendorService->updateVendor($vendor, $validated);
        return response()->json(['data' => $vendor]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Vendor::where('id', $id);
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $vendor = $query->firstOrFail();
        $vendor->delete();
        return response()->noContent();
    }
}
