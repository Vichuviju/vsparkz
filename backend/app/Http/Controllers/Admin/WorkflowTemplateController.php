<?php

namespace App\Http\Controllers\Admin;

use App\Models\WorkflowTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowTemplateController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = WorkflowTemplate::withCount('taskBlueprints')->orderBy('name');
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
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'definition_json' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);
        $validated['is_active'] = $validated['is_active'] ?? true;
        $tenantId = $this->getTenantId($request);
        $validated['tenant_id'] = $tenantId;
        $item = WorkflowTemplate::create($validated);
        return response()->json(['data' => $item], 201);
    }

    public function show(Request $request, WorkflowTemplate $workflowTemplate): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $workflowTemplate->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Workflow template not found or access denied.'], 404);
        }
        $workflowTemplate->load('taskBlueprints');
        return response()->json(['data' => $workflowTemplate]);
    }

    public function update(Request $request, WorkflowTemplate $workflowTemplate): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $workflowTemplate->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Workflow template not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'definition_json' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);
        $workflowTemplate->update($validated);
        return response()->json(['data' => $workflowTemplate->fresh()]);
    }

    public function destroy(Request $request, WorkflowTemplate $workflowTemplate): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $workflowTemplate->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Workflow template not found or access denied.'], 404);
        }
        $workflowTemplate->delete();
        return response()->noContent();
    }
}
