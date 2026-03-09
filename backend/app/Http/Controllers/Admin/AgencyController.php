<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgencyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Agency::query()->orderBy('name');
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%")
                    ->orWhere('domain', 'like', "%{$q}%");
            });
        }
        $agencies = $query->paginate($request->get('per_page', 15));
        return response()->json($agencies);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:agencies,slug',
            'logo_url' => 'nullable|string|max:500',
            'primary_color' => 'nullable|string|max:20',
            'domain' => 'nullable|string|max:255',
            'settings' => 'nullable|array',
        ]);
        $agency = Agency::create($validated);
        return response()->json($agency, 201);
    }

    public function show(Agency $agency): JsonResponse
    {
        $agency->loadCount(['users', 'leads', 'clients', 'projects']);
        return response()->json($agency);
    }

    public function update(Request $request, Agency $agency): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:100|unique:agencies,slug,' . $agency->id,
            'logo_url' => 'nullable|string|max:500',
            'primary_color' => 'nullable|string|max:20',
            'domain' => 'nullable|string|max:255',
            'settings' => 'nullable|array',
        ]);
        $agency->update($validated);
        return response()->json($agency->fresh());
    }

    public function destroy(Agency $agency): JsonResponse
    {
        $agency->delete();
        return response()->json(['message' => 'Agency deleted']);
    }
}
