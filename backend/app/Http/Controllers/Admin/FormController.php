<?php

namespace App\Http\Controllers\Admin;

use App\Models\Form;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FormController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = Form::query()->orderBy('name');
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
            'description' => 'nullable|string',
            'definition_json' => 'nullable|array',
            'destination_type' => 'nullable|string|max:50',
            'destination_config_json' => 'nullable|array',
            'status' => 'nullable|string|max:30',
        ]);
        $tenantId = $this->getTenantId($request);
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }
        $validated['status'] = $validated['status'] ?? 'draft';
        $form = Form::create(array_merge($validated, ['tenant_id' => $tenantId]));
        return response()->json(['data' => $form], 201);
    }

    public function show(Request $request, Form $form): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $form->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Form not found or access denied.'], 404);
        }
        return response()->json(['data' => $form]);
    }

    public function update(Request $request, Form $form): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $form->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Form not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'definition_json' => 'nullable|array',
            'destination_type' => 'nullable|string|max:50',
            'destination_config_json' => 'nullable|array',
            'status' => 'nullable|string|max:30',
        ]);
        $form->update($validated);
        return response()->json(['data' => $form->fresh()]);
    }

    public function destroy(Request $request, Form $form): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $form->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Form not found or access denied.'], 404);
        }
        $form->delete();
        return response()->noContent();
    }
}
