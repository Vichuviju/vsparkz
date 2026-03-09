<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Freelancer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FreelancerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Freelancer::query()->forTenant();
        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->is_active);
        }
        $items = $query->orderBy('name')->paginate($request->get('per_page', 15));
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'skills' => 'nullable|array',
            'service_category_ids' => 'nullable|array',
            'pricing' => 'nullable|array',
            'portfolio_links' => 'nullable|array',
            'delivery_days' => 'nullable|integer',
            'commission_percent' => 'nullable|numeric',
            'company_or_individual' => 'nullable|string|max:30',
            'availability' => 'nullable|string|max:30',
            'is_active' => 'nullable|boolean',
        ]);
        $v['is_active'] = $v['is_active'] ?? true;
        if (! auth()->user()->isSuperAdmin()) {
            $v['tenant_id'] = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        }
        $item = Freelancer::create($v);
        return response()->json($item, 201);
    }

    public function show(Freelancer $freelancer): JsonResponse
    {
        $freelancer = Freelancer::forTenant()->findOrFail($freelancer->id);
        $freelancer->loadCount('ratings');
        return response()->json($freelancer);
    }

    public function update(Request $request, Freelancer $freelancer): JsonResponse
    {
        $freelancer = Freelancer::forTenant()->findOrFail($freelancer->id);
        $v = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'skills' => 'nullable|array',
            'service_category_ids' => 'nullable|array',
            'pricing' => 'nullable|array',
            'portfolio_links' => 'nullable|array',
            'delivery_days' => 'nullable|integer',
            'commission_percent' => 'nullable|numeric',
            'company_or_individual' => 'nullable|string|max:30',
            'availability' => 'nullable|string|max:30',
            'is_active' => 'nullable|boolean',
        ]);
        $freelancer->update($v);
        return response()->json($freelancer->fresh());
    }

    public function destroy(Freelancer $freelancer): JsonResponse
    {
        $freelancer = Freelancer::forTenant()->findOrFail($freelancer->id);
        $freelancer->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
