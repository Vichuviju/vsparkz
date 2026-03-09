<?php

namespace App\Http\Controllers\Admin;

use App\Models\Client;
use App\Models\Deal;
use App\Models\DealStage;
use App\Models\Lead;
use App\Services\DealService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DealController extends BaseController
{
    public function __construct(
        protected DealService $dealService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Deal::with(['currentStage', 'client', 'lead', 'owner'])->orderByDesc('updated_at');
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $deals = $query->get();
        return response()->json(['data' => $deals]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:leads,id',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'expected_close_date' => 'nullable|date',
            'current_stage_id' => 'nullable|exists:deal_stages,id',
            'owner_id' => 'nullable|exists:users,id',
            'source' => 'nullable|string|max:100',
            'probability' => 'nullable|numeric|min:0|max:100',
        ]);
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null) {
            if (! empty($validated['client_id']) && ! Client::where('tenant_id', $tenantId)->where('id', $validated['client_id'])->exists()) {
                return response()->json(['message' => 'Client not found or access denied.'], 404);
            }
            if (! empty($validated['lead_id']) && ! Lead::where('tenant_id', $tenantId)->where('id', $validated['lead_id'])->exists()) {
                return response()->json(['message' => 'Lead not found or access denied.'], 404);
            }
        }
        $deal = $this->dealService->createDeal($validated, $tenantId);
        $deal->load(['currentStage', 'client', 'lead', 'owner']);
        return response()->json(['data' => $deal], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Deal::with(['currentStage', 'client', 'lead', 'owner', 'activities'])->where('id', $id);
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $deal = $query->firstOrFail();
        return response()->json(['data' => $deal]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $deal = Deal::where('id', $id);
        if ($tenantId !== null) {
            $deal->where('tenant_id', $tenantId);
        }
        $deal = $deal->firstOrFail();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:leads,id',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'expected_close_date' => 'nullable|date',
            'current_stage_id' => 'nullable|exists:deal_stages,id',
            'owner_id' => 'nullable|exists:users,id',
            'source' => 'nullable|string|max:100',
            'probability' => 'nullable|numeric|min:0|max:100',
        ]);
        if ($tenantId !== null && ! empty($validated['client_id']) && ! Client::where('tenant_id', $tenantId)->where('id', $validated['client_id'])->exists()) {
            return response()->json(['message' => 'Client not found or access denied.'], 404);
        }
        if ($tenantId !== null && ! empty($validated['lead_id']) && ! Lead::where('tenant_id', $tenantId)->where('id', $validated['lead_id'])->exists()) {
            return response()->json(['message' => 'Lead not found or access denied.'], 404);
        }
        $deal = $this->dealService->updateDeal($deal, $validated);
        $deal->load(['currentStage', 'client', 'lead', 'owner']);
        return response()->json(['data' => $deal]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Deal::where('id', $id);
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $deal = $query->firstOrFail();
        $deal->delete();
        return response()->noContent();
    }
}
