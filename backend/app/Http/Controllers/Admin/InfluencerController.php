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
        $query = Influencer::query()->with(['contentCategory', 'assignedMember', 'reportingManager'])->orderByDesc('created_at');
        if ($request->filled('platform')) {
            $query->where('platform', $request->platform);
        }
        if ($request->filled('content_category_id')) {
            $query->where('content_category_id', $request->content_category_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('work_status')) {
            $query->where('work_status', $request->work_status);
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
            'profile_image' => 'nullable|string',
            'platform' => 'nullable|string|max:50',
            'followers' => 'nullable|integer|min:0',
            'youtube_followers' => 'nullable|integer|min:0',
            'instagram_followers' => 'nullable|integer|min:0',
            'engagement_rate' => 'nullable|numeric|min:0|max:100',
            'language' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'content_category_id' => 'nullable|exists:influencer_categories,id',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'meta' => 'nullable|array',
            'source' => 'nullable|string|max:100',
            'enrolled_at' => 'nullable|date',
            'status' => 'nullable|string|max:30',
            'work_status' => 'nullable|string|max:30',
            'growth_status' => 'nullable|string|max:30',
            'male_percentage' => 'nullable|numeric|min:0|max:100',
            'female_percentage' => 'nullable|numeric|min:0|max:100',
            'peak_time' => 'nullable|string|max:50',
            'assigned_team_member_id' => 'nullable|exists:users,id',
            'reporting_manager_id' => 'nullable|exists:users,id',
            'pricing_per_post' => 'nullable|numeric|min:0',
            'pricing_per_reel' => 'nullable|numeric|min:0',
            'pricing_per_story' => 'nullable|numeric|min:0',
            'expected_growth_notes' => 'nullable|string',
        ]);
        $influencer = Influencer::create($validated);
        return response()->json($influencer, 201);
    }

    public function show(Influencer $influencer): JsonResponse
    {
        $influencer->load(['contentCategory', 'assignedMember', 'reportingManager', 'engagementLogs']);
        return response()->json($influencer);
    }

    public function update(Request $request, Influencer $influencer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'profile_image' => 'nullable|string',
            'platform' => 'nullable|string|max:50',
            'followers' => 'nullable|integer|min:0',
            'youtube_followers' => 'nullable|integer|min:0',
            'instagram_followers' => 'nullable|integer|min:0',
            'engagement_rate' => 'nullable|numeric|min:0|max:100',
            'language' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'content_category_id' => 'nullable|exists:influencer_categories,id',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'meta' => 'nullable|array',
            'source' => 'nullable|string|max:100',
            'enrolled_at' => 'nullable|date',
            'status' => 'nullable|string|max:30',
            'work_status' => 'nullable|string|max:30',
            'growth_status' => 'nullable|string|max:30',
            'male_percentage' => 'nullable|numeric|min:0|max:100',
            'female_percentage' => 'nullable|numeric|min:0|max:100',
            'peak_time' => 'nullable|string|max:50',
            'assigned_team_member_id' => 'nullable|exists:users,id',
            'reporting_manager_id' => 'nullable|exists:users,id',
            'pricing_per_post' => 'nullable|numeric|min:0',
            'pricing_per_reel' => 'nullable|numeric|min:0',
            'pricing_per_story' => 'nullable|numeric|min:0',
            'expected_growth_notes' => 'nullable|string',
        ]);
        $influencer->update($validated);
        return response()->json($influencer->load(['contentCategory', 'assignedMember', 'reportingManager']));
    }

    public function destroy(Influencer $influencer): JsonResponse
    {
        $influencer->delete();
        return response()->json(['message' => 'Influencer deleted']);
    }
}
