<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PricingLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PricingLevelController extends Controller
{
    public function index(): JsonResponse
    {
        $items = PricingLevel::orderBy('sort_order')->orderBy('id')->get();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'required|string|max:50|unique:pricing_levels,slug',
            'label' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);
        $item = PricingLevel::create($validated);
        return response()->json($item, 201);
    }

    public function show(PricingLevel $pricingLevel): JsonResponse
    {
        return response()->json($pricingLevel);
    }

    public function update(Request $request, PricingLevel $pricingLevel): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'sometimes|string|max:50|unique:pricing_levels,slug,' . $pricingLevel->id,
            'label' => 'sometimes|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);
        $pricingLevel->update($validated);
        return response()->json($pricingLevel->fresh());
    }

    public function destroy(PricingLevel $pricingLevel): JsonResponse
    {
        $pricingLevel->delete();
        return response()->json(['message' => 'Pricing level deleted']);
    }
}
