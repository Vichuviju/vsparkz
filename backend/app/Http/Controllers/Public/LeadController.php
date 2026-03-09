<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    /**
     * Submit contact or get-quote form (unauthenticated).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'service_id' => 'nullable|exists:services,id',
            'subject' => 'nullable|string|max:255',
            'message' => 'nullable|string',
            'source' => 'required|string|in:contact,get_quote',
            'selected_combo_package_id' => 'nullable|exists:combo_packages,id',
            'custom_package_data' => 'nullable|array',
            'custom_package_data.sub_service_ids' => 'nullable|array',
            'custom_package_data.sub_service_ids.*' => 'integer|exists:sub_services,id',
            'custom_package_data.pricing_type' => 'nullable|string|in:average,freelance',
            'custom_package_data.freelancer_selections' => 'nullable|array',
            'custom_package_data.freelancer_selections.*' => 'integer|exists:freelancers,id',
            'pricing_type' => 'nullable|string|in:average,freelance',
        ]);
        $validated['status'] = Lead::STATUS_NEW;
        if (! empty($validated['custom_package_data']['pricing_type'])) {
            $validated['pricing_type'] = $validated['custom_package_data']['pricing_type'];
        }
        $tenantId = $request->attributes->get('tenant_id');
        if ($tenantId !== null) {
            $validated['tenant_id'] = $tenantId;
        }
        $lead = Lead::create($validated);
        return response()->json(['message' => 'Thank you. We will get back to you soon.', 'id' => $lead->id], 201);
    }
}
