<?php

namespace App\Http\Controllers\Admin;

use App\Models\OnboardingQuestionnaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingQuestionnaireController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $query = OnboardingQuestionnaire::query()->orderBy('name');
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
            'definition_json' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);
        $validated['is_default'] = $validated['is_default'] ?? false;
        $tenantId = $this->getTenantId($request);
        $item = OnboardingQuestionnaire::create(array_merge($validated, ['tenant_id' => $tenantId]));
        return response()->json(['data' => $item], 201);
    }

    public function show(Request $request, OnboardingQuestionnaire $onboardingQuestionnaire): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $onboardingQuestionnaire->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Onboarding questionnaire not found or access denied.'], 404);
        }
        return response()->json(['data' => $onboardingQuestionnaire]);
    }

    public function update(Request $request, OnboardingQuestionnaire $onboardingQuestionnaire): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $onboardingQuestionnaire->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Onboarding questionnaire not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'definition_json' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);
        $onboardingQuestionnaire->update($validated);
        return response()->json(['data' => $onboardingQuestionnaire->fresh()]);
    }

    public function destroy(Request $request, OnboardingQuestionnaire $onboardingQuestionnaire): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $onboardingQuestionnaire->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Onboarding questionnaire not found or access denied.'], 404);
        }
        $onboardingQuestionnaire->delete();
        return response()->noContent();
    }
}
