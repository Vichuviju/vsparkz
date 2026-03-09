<?php

namespace App\Http\Controllers\Admin;

use App\Models\AutomationWorkflow;
use App\Services\AutomationEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutomationWorkflowController extends BaseController
{
    public function index(Request $request, AutomationEngineService $service): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = AutomationWorkflow::query()->orderBy('name');
        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }
        $items = $query->get();
        return response()->json(['data' => $items]);
    }

    public function store(Request $request, AutomationEngineService $service): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'definition_json' => 'nullable|array',
        ]);
        $validated['is_active'] = $validated['is_active'] ?? true;
        $tenantId = $this->getTenantId($request);
        $workflow = $service->createWorkflow($validated, $tenantId);
        return response()->json(['data' => $workflow], 201);
    }

    public function show(Request $request, AutomationWorkflow $automationWorkflow): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $automationWorkflow->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Automation workflow not found or access denied.'], 404);
        }
        return response()->json(['data' => $automationWorkflow]);
    }

    public function update(Request $request, AutomationWorkflow $automationWorkflow, AutomationEngineService $service): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $automationWorkflow->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Automation workflow not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'definition_json' => 'nullable|array',
        ]);
        $workflow = $service->updateWorkflow($automationWorkflow, $validated);
        return response()->json(['data' => $workflow]);
    }

    public function destroy(Request $request, AutomationWorkflow $automationWorkflow): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $automationWorkflow->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Automation workflow not found or access denied.'], 404);
        }
        $automationWorkflow->delete();
        return response()->noContent();
    }
}
