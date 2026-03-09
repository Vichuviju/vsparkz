<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SubService::with('service');
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }
        return response()->json($query->orderBy('sort_order')->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'service_id' => 'required|exists:services,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'average_price' => 'nullable|numeric|min:0',
            'freelance_price' => 'nullable|numeric|min:0',
            'average_duration_value' => 'nullable|integer|min:0',
            'average_duration_unit' => 'nullable|string|max:20|in:days,months,posts',
            'service_type' => 'nullable|string|in:one-time,recurring',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);
        $item = SubService::create($v);
        return response()->json($item->load('service'), 201);
    }

    public function show(SubService $subService): JsonResponse
    {
        return response()->json($subService->load('service'));
    }

    public function update(Request $request, SubService $subService): JsonResponse
    {
        $v = $request->validate([
            'service_id' => 'sometimes|exists:services,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'average_price' => 'nullable|numeric|min:0',
            'freelance_price' => 'nullable|numeric|min:0',
            'average_duration_value' => 'nullable|integer|min:0',
            'average_duration_unit' => 'nullable|string|max:20|in:days,months,posts',
            'service_type' => 'nullable|string|in:one-time,recurring',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);
        $subService->update($v);
        return response()->json($subService->fresh()->load('service'));
    }

    public function destroy(SubService $subService): JsonResponse
    {
        $subService->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
