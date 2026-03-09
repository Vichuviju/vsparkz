<?php

namespace App\Http\Controllers\Admin;

use App\Models\Brand;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Brand::with('client')->orderBy('name');
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $items = $query->get();
        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:100',
            'client_id' => 'nullable|exists:clients,id',
            'default_currency' => 'nullable|string|max:10',
            'time_zone' => 'nullable|string|max:50',
        ]);
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && ! empty($validated['client_id']) && ! Client::where('tenant_id', $tenantId)->where('id', $validated['client_id'])->exists()) {
            return response()->json(['message' => 'Client not found or access denied.'], 404);
        }
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }
        $brand = Brand::create(array_merge($validated, ['tenant_id' => $tenantId]));
        return response()->json(['data' => $brand->load('client')], 201);
    }

    public function show(Request $request, Brand $brand): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $brand->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Brand not found or access denied.'], 404);
        }
        $brand->load(['client', 'locations']);
        return response()->json(['data' => $brand]);
    }

    public function update(Request $request, Brand $brand): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $brand->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Brand not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:100',
            'client_id' => 'nullable|exists:clients,id',
            'default_currency' => 'nullable|string|max:10',
            'time_zone' => 'nullable|string|max:50',
        ]);
        if ($tenantId !== null && ! empty($validated['client_id']) && ! Client::where('tenant_id', $tenantId)->where('id', $validated['client_id'])->exists()) {
            return response()->json(['message' => 'Client not found or access denied.'], 404);
        }
        $brand->update($validated);
        return response()->json(['data' => $brand->fresh('client')]);
    }

    public function destroy(Request $request, Brand $brand): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $brand->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Brand not found or access denied.'], 404);
        }
        $brand->delete();
        return response()->noContent();
    }
}
