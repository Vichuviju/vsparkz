<?php

namespace App\Http\Controllers\Admin;

use App\Models\KnowledgeSpace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeSpaceController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = KnowledgeSpace::withCount('articles')->orderBy('name');
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
            'visibility' => 'nullable|string|max:30',
            'allowed_roles_json' => 'nullable|array',
        ]);
        $tenantId = $this->getTenantId($request);
        $validated['tenant_id'] = $tenantId;
        $item = KnowledgeSpace::create($validated);
        return response()->json(['data' => $item], 201);
    }

    public function show(Request $request, KnowledgeSpace $knowledgeSpace): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $knowledgeSpace->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Knowledge space not found or access denied.'], 404);
        }
        $knowledgeSpace->load('articles');
        return response()->json(['data' => $knowledgeSpace]);
    }

    public function update(Request $request, KnowledgeSpace $knowledgeSpace): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $knowledgeSpace->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Knowledge space not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'nullable|string|max:30',
            'allowed_roles_json' => 'nullable|array',
        ]);
        $knowledgeSpace->update($validated);
        return response()->json(['data' => $knowledgeSpace->fresh()]);
    }

    public function destroy(Request $request, KnowledgeSpace $knowledgeSpace): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $knowledgeSpace->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Knowledge space not found or access denied.'], 404);
        }
        $knowledgeSpace->delete();
        return response()->noContent();
    }
}
