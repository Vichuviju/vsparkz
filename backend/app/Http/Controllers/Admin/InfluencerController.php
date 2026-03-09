<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Influencer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfluencerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Influencer::query()->orderByDesc('created_at');
        if ($request->filled('platform')) {
            $query->where('platform', $request->platform);
        }
        if ($request->filled('category')) {
            $query->where('category', 'like', '%' . $request->category . '%');
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%");
            });
        }
        $influencers = $query->paginate($request->get('per_page', 15));
        return response()->json($influencers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'platform' => 'nullable|string|max:50',
            'followers' => 'nullable|integer|min:0',
            'engagement_rate' => 'nullable|numeric|min:0|max:100',
            'language' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'meta' => 'nullable|array',
            'source' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:30',
        ]);
        $influencer = Influencer::create($validated);
        return response()->json($influencer, 201);
    }

    public function show(Influencer $influencer): JsonResponse
    {
        return response()->json($influencer);
    }

    public function update(Request $request, Influencer $influencer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'platform' => 'nullable|string|max:50',
            'followers' => 'nullable|integer|min:0',
            'engagement_rate' => 'nullable|numeric|min:0|max:100',
            'language' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'meta' => 'nullable|array',
            'source' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:30',
        ]);
        $influencer->update($validated);
        return response()->json($influencer->fresh());
    }

    public function destroy(Influencer $influencer): JsonResponse
    {
        $influencer->delete();
        return response()->json(['message' => 'Influencer deleted']);
    }
}
