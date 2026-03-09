<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServicePrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServicePriceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ServicePrice::with(['service', 'subService', 'pricingLevel']);
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }
        $items = $query->orderBy('service_id')->orderBy('id')->get();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'sub_service_id' => 'nullable|exists:sub_services,id',
            'pricing_level_id' => 'required|exists:pricing_levels,id',
            'amount' => 'required|numeric|min:0',
            'duration_value' => 'nullable|integer',
            'duration_unit' => 'nullable|string|max:20',
            'frequency' => 'nullable|string|in:one-time,weekly,monthly',
        ]);
        $item = ServicePrice::create($validated);
        return response()->json($item->load(['service', 'subService', 'pricingLevel']), 201);
    }

    public function show(ServicePrice $servicePrice): JsonResponse
    {
        return response()->json($servicePrice->load(['service', 'subService', 'pricingLevel']));
    }

    public function update(Request $request, ServicePrice $servicePrice): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => 'sometimes|exists:services,id',
            'sub_service_id' => 'nullable|exists:sub_services,id',
            'pricing_level_id' => 'sometimes|exists:pricing_levels,id',
            'amount' => 'sometimes|numeric|min:0',
            'duration_value' => 'nullable|integer',
            'duration_unit' => 'nullable|string|max:20',
            'frequency' => 'nullable|string|in:one-time,weekly,monthly',
        ]);
        $servicePrice->update($validated);
        return response()->json($servicePrice->fresh()->load(['service', 'subService', 'pricingLevel']));
    }

    public function destroy(ServicePrice $servicePrice): JsonResponse
    {
        $servicePrice->delete();
        return response()->json(['message' => 'Service price deleted']);
    }
}
