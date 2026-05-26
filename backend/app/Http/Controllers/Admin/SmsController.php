<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmsCampaign;
use App\Models\SmsLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SmsCampaign::query()->forTenant();
        
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $campaigns = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));
        return response()->json($campaigns);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'message' => 'required|string|max:160',
            'scheduled_at' => 'nullable|date',
        ]);

        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;

        $campaign = SmsCampaign::create([
            'tenant_id' => $tid,
            'name' => $validated['name'],
            'message' => $validated['message'],
            'scheduled_at' => $validated['scheduled_at'],
            'status' => 'draft',
        ]);

        return response()->json($campaign, 201);
    }

    public function show(SmsCampaign $smsCampaign): JsonResponse
    {
        return response()->json($smsCampaign->load('logs'));
    }

    public function update(Request $request, SmsCampaign $smsCampaign): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:160',
            'scheduled_at' => 'nullable|date',
            'status' => 'sometimes|in:draft,scheduled,sending,sent,failed',
        ]);

        $smsCampaign->update($validated);
        return response()->json($smsCampaign);
    }

    public function destroy(SmsCampaign $smsCampaign): JsonResponse
    {
        $smsCampaign->delete();
        return response()->json(['message' => 'Campaign deleted']);
    }

    public function send(SmsCampaign $smsCampaign): JsonResponse
    {
        if ($smsCampaign->status === 'sent') {
            return response()->json(['message' => 'Campaign already sent'], 422);
        }

        $smsCampaign->update(['status' => 'sent']);

        // Mocking individual logs
        SmsLog::create([
            'sms_campaign_id' => $smsCampaign->id,
            'phone_number' => '1234567890',
            'status' => 'sent',
        ]);

        return response()->json(['message' => 'Campaign sent successfully']);
    }
}
