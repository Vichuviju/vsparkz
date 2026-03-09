<?php

namespace App\Http\Controllers\Admin;

use App\Models\ReportTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportTemplateController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = ReportTemplate::query()->orderBy('name');
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
            'description' => 'nullable|string',
            'scope' => 'nullable|string|max:100',
            'layout_json' => 'nullable|array',
            'config_json' => 'nullable|array',
        ]);
        $tenantId = $this->getTenantId($request);
        $item = ReportTemplate::create(array_merge($validated, ['tenant_id' => $tenantId]));
        return response()->json(['data' => $item], 201);
    }

    public function show(Request $request, ReportTemplate $reportTemplate): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $reportTemplate->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Report template not found or access denied.'], 404);
        }
        return response()->json(['data' => $reportTemplate]);
    }

    public function update(Request $request, ReportTemplate $reportTemplate): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $reportTemplate->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Report template not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'scope' => 'nullable|string|max:100',
            'layout_json' => 'nullable|array',
            'config_json' => 'nullable|array',
        ]);
        $reportTemplate->update($validated);
        return response()->json(['data' => $reportTemplate->fresh()]);
    }

    public function destroy(Request $request, ReportTemplate $reportTemplate): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $reportTemplate->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Report template not found or access denied.'], 404);
        }
        $reportTemplate->delete();
        return response()->noContent();
    }
}
