<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Influencer;
use App\Models\InfluencerEngagementLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfluencerEngagementController extends Controller
{
    public function index(Influencer $influencer): JsonResponse
    {
        return response()->json($influencer->engagementLogs);
    }

    public function store(Request $request, Influencer $influencer): JsonResponse
    {
        $validated = $request->validate([
            'engagement_rate' => 'nullable|numeric|min:0|max:100',
            'followers' => 'nullable|integer|min:0',
            'instagram_followers' => 'nullable|integer|min:0',
            'youtube_followers' => 'nullable|integer|min:0',
            'log_date' => 'required|date',
        ]);

        $log = $influencer->engagementLogs()->create($validated);

        // Also update the main influencer record with the latest stats
        $influencer->update([
            'engagement_rate' => $validated['engagement_rate'] ?? $influencer->engagement_rate,
            'followers' => $validated['followers'] ?? $influencer->followers,
            'instagram_followers' => $validated['instagram_followers'] ?? $influencer->instagram_followers,
            'youtube_followers' => $validated['youtube_followers'] ?? $influencer->youtube_followers,
            'last_analytics_updated' => now(),
        ]);

        return response()->json($log, 201);
    }

    public function destroy(Influencer $influencer, InfluencerEngagementLog $log): JsonResponse
    {
        $log->delete();
        return response()->json(['message' => 'Log deleted']);
    }
}
