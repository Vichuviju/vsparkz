<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::orderBy('sort_order')->orderBy('id');
        $withTotals = $request->boolean('with_totals');
        if ($withTotals) {
            $query->with('subServices');
        }
        $services = $query->get();
        if ($withTotals) {
            $services = $services->map(fn (Service $s) => $this->appendSubserviceTotals($s));
        }
        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:services,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'image' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'category' => 'nullable|string|max:100',
            'service_type' => 'nullable|string|in:one-time,recurring',
            'default_duration_value' => 'nullable|integer',
            'default_duration_unit' => 'nullable|string|max:20',
            'dependencies' => 'nullable|array',
            'dependencies.*' => 'integer|exists:services,id',
        ]);
        $service = Service::create($validated);
        return response()->json($service, 201);
    }

    public function show(Service $service): JsonResponse
    {
        $service->load('subServices');
        return response()->json($this->appendSubserviceTotals($service));
    }

    private function appendSubserviceTotals(Service $service): Service
    {
        $subServices = $service->relationLoaded('subServices') ? $service->subServices : $service->subServices()->get();
        $activeSubs = $subServices->filter(fn ($ss) => $ss->is_active);
        $totalPrice = $activeSubs->sum(fn ($ss) => (float) ($ss->average_price ?? 0));
        $byUnit = [];
        foreach ($activeSubs as $ss) {
            if ($ss->average_duration_value !== null && $ss->average_duration_unit) {
                $unit = $ss->average_duration_unit;
                $byUnit[$unit] = ($byUnit[$unit] ?? 0) + (int) $ss->average_duration_value;
            }
        }
        $service->setAttribute('subservice_total_price', round($totalPrice, 2));
        $service->setAttribute('subservice_total_duration', $byUnit);
        return $service;
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:services,slug,' . $service->id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'image' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'category' => 'nullable|string|max:100',
            'service_type' => 'nullable|string|in:one-time,recurring',
            'default_duration_value' => 'nullable|integer',
            'default_duration_unit' => 'nullable|string|max:20',
            'dependencies' => 'nullable|array',
            'dependencies.*' => 'integer|exists:services,id',
        ]);
        $service->update($validated);
        return response()->json($service->fresh());
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();
        return response()->json(['message' => 'Service deleted']);
    }
}
