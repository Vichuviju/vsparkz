<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::orderBy('id')->get();
        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:30',
            'duration_days' => 'nullable|integer|min:0',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:5',
            'is_active' => 'nullable|boolean',
        ]);
        $validated['type'] = $validated['type'] ?? 'monthly';
        $validated['currency'] = $validated['currency'] ?? 'INR';
        $validated['is_active'] = $validated['is_active'] ?? true;
        $plan = Plan::create($validated);
        return response()->json($plan, 201);
    }

    public function show(Plan $plan): JsonResponse
    {
        return response()->json($plan);
    }

    public function update(Request $request, Plan $plan): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'nullable|string|max:30',
            'duration_days' => 'nullable|integer|min:0',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:5',
            'is_active' => 'nullable|boolean',
        ]);
        $plan->update($validated);
        return response()->json($plan->fresh());
    }

    public function destroy(Plan $plan): JsonResponse
    {
        $plan->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
