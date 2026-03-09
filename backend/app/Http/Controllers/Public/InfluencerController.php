<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Influencer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfluencerController extends Controller
{
    /**
     * Submit influencer onboarding form (unauthenticated).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'platform' => 'nullable|string|max:50',
            'followers' => 'nullable|integer|min:0',
            'engagement_rate' => 'nullable|numeric|min:0|max:100',
            'language' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
        ]);
        $validated['source'] = 'onboarding_form';
        $validated['status'] = Influencer::STATUS_NEW;
        $influencer = Influencer::create($validated);
        return response()->json(['message' => 'Thank you for registering. We will be in touch.', 'id' => $influencer->id], 201);
    }
}
