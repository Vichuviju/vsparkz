<?php

namespace App\Http\Controllers\Admin;

use App\Models\Keyword;
use App\Models\Client;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KeywordController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Keyword::with(['client', 'campaign'])->orderBy('keyword');
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        $items = $query->get();
        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'keyword' => 'required|string|max:255',
            'target_url' => 'nullable|string|max:500',
            'priority' => 'nullable|integer|min:0',
            'status' => 'nullable|string|max:50',
            'client_id' => 'nullable|exists:clients,id',
            'campaign_id' => 'nullable|exists:campaigns,id',
        ]);
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null) {
            if (! empty($validated['client_id']) && ! Client::where('tenant_id', $tenantId)->where('id', $validated['client_id'])->exists()) {
                return response()->json(['message' => 'Client not found or access denied.'], 404);
            }
            if (! empty($validated['campaign_id']) && ! Campaign::where('tenant_id', $tenantId)->where('id', $validated['campaign_id'])->exists()) {
                return response()->json(['message' => 'Campaign not found or access denied.'], 404);
            }
        }
        $keyword = Keyword::create(array_merge($validated, ['tenant_id' => $tenantId]));
        return response()->json(['data' => $keyword->load(['client', 'campaign'])], 201);
    }

    public function show(Request $request, Keyword $keyword): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $keyword->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Keyword not found or access denied.'], 404);
        }
        $keyword->load(['client', 'campaign', 'rankings']);
        return response()->json(['data' => $keyword]);
    }

    public function update(Request $request, Keyword $keyword): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $keyword->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Keyword not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'keyword' => 'sometimes|string|max:255',
            'target_url' => 'nullable|string|max:500',
            'priority' => 'nullable|integer|min:0',
            'status' => 'nullable|string|max:50',
            'client_id' => 'nullable|exists:clients,id',
            'campaign_id' => 'nullable|exists:campaigns,id',
        ]);
        if ($tenantId !== null) {
            if (! empty($validated['client_id']) && ! Client::where('tenant_id', $tenantId)->where('id', $validated['client_id'])->exists()) {
                return response()->json(['message' => 'Client not found or access denied.'], 404);
            }
            if (! empty($validated['campaign_id']) && ! Campaign::where('tenant_id', $tenantId)->where('id', $validated['campaign_id'])->exists()) {
                return response()->json(['message' => 'Campaign not found or access denied.'], 404);
            }
        }
        $keyword->update($validated);
        return response()->json(['data' => $keyword->fresh(['client', 'campaign'])]);
    }

    public function destroy(Request $request, Keyword $keyword): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $keyword->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Keyword not found or access denied.'], 404);
        }
        $keyword->delete();
        return response()->noContent();
    }
}
