<?php

namespace App\Http\Controllers\Admin\Platform;

use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlanController extends PlatformBaseController
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $query = SubscriptionPlan::query()->orderBy('sort_order')->orderBy('id');
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }
        $plans = $query->get();
        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:100|unique:subscription_plans,slug',
            'price_monthly' => 'nullable|numeric|min:0',
            'price_yearly' => 'nullable|numeric|min:0',
            'max_clients' => 'nullable|integer|min:0',
            'max_projects' => 'nullable|integer|min:0',
            'max_users' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['is_active'] = $validated['is_active'] ?? true;
        $plan = SubscriptionPlan::create($validated);
        return response()->json($plan, 201);
    }

    public function show(SubscriptionPlan $subscription_plan): JsonResponse
    {
        $this->ensureSuperAdmin();
        return response()->json($subscription_plan);
    }

    public function update(Request $request, SubscriptionPlan $subscription_plan): JsonResponse
    {
        $this->ensureSuperAdmin();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:100|unique:subscription_plans,slug,' . $subscription_plan->id,
            'price_monthly' => 'nullable|numeric|min:0',
            'price_yearly' => 'nullable|numeric|min:0',
            'max_clients' => 'nullable|integer|min:0',
            'max_projects' => 'nullable|integer|min:0',
            'max_users' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $subscription_plan->update($validated);
        return response()->json($subscription_plan->fresh());
    }

    public function destroy(SubscriptionPlan $subscription_plan): JsonResponse
    {
        $this->ensureSuperAdmin();
        $subscription_plan->delete();
        return response()->json(['message' => 'Plan deleted']);
    }
}
