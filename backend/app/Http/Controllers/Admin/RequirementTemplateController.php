<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RequirementTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RequirementTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RequirementTemplate::query()->orderBy('name');
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }
        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);
        $item = RequirementTemplate::create($validated);
        return response()->json($item, 201);
    }

    public function show(RequirementTemplate $requirementTemplate): JsonResponse
    {
        return response()->json($requirementTemplate);
    }

    public function update(Request $request, RequirementTemplate $requirementTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);
        $requirementTemplate->update($validated);
        return response()->json($requirementTemplate->fresh());
    }

    public function destroy(RequirementTemplate $requirementTemplate): JsonResponse
    {
        $requirementTemplate->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
