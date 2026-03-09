<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Campaign::query()->with(['project:id,name,client_id', 'clientRelation:id,company_name']);
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        $campaigns = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));
        return response()->json($campaigns);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'client_id' => 'nullable|exists:clients,id',
            'name' => 'required|string|max:255',
            'client' => 'nullable|string|max:255',
            'influencer_name' => 'nullable|string|max:255',
            'platform' => 'nullable|string|max:255',
            'influencer_reach' => 'nullable|integer|min:0',
            'engagement_rate' => 'nullable|numeric|min:0',
            'result_summary' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:active,completed,paused',
        ]);
        $campaign = Campaign::create($validated);
        $campaign->load(['project:id,name,client_id', 'clientRelation:id,company_name']);
        return response()->json($campaign, 201);
    }

    public function show(Campaign $campaign): JsonResponse
    {
        $campaign->load(['project:id,name,client_id', 'clientRelation:id,company_name']);
        return response()->json($campaign);
    }

    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'client_id' => 'nullable|exists:clients,id',
            'name' => 'sometimes|string|max:255',
            'client' => 'nullable|string|max:255',
            'influencer_name' => 'nullable|string|max:255',
            'platform' => 'nullable|string|max:255',
            'influencer_reach' => 'nullable|integer|min:0',
            'engagement_rate' => 'nullable|numeric|min:0',
            'result_summary' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|in:active,completed,paused',
        ]);
        $campaign->update($validated);
        return response()->json($campaign->fresh(['project:id,name,client_id', 'clientRelation:id,company_name']));
    }

    public function destroy(Campaign $campaign): JsonResponse
    {
        $campaign->delete();
        return response()->json(['message' => 'Campaign deleted']);
    }
}
