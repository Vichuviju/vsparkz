<?php

namespace App\Http\Controllers\Admin\Platform;

use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends PlatformBaseController
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $query = Subscription::query()->with(['tenant:id,name,slug,status', 'plan:id,name,slug']);
        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $subscriptions = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));
        return response()->json($subscriptions);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'plan_id' => 'required|exists:subscription_plans,id',
            'billing_cycle' => 'required|string|in:monthly,yearly',
            'started_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'trial_ends_at' => 'nullable|date',
        ]);
        $validated['status'] = Subscription::STATUS_ACTIVE;
        $validated['started_at'] = $validated['started_at'] ?? now();
        $subscription = Subscription::create($validated);
        $tenant = Tenant::find($validated['tenant_id']);
        if ($tenant) {
            $tenant->update(['plan_id' => $validated['plan_id'], 'subscription_id' => $subscription->id]);
            if (! empty($validated['expires_at'])) {
                $tenant->update(['subscription_ends_at' => $validated['expires_at']]);
            }
        }
        return response()->json($subscription->load(['tenant:id,name,slug', 'plan:id,name,slug']), 201);
    }

    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        $this->ensureSuperAdmin();
        $validated = $request->validate([
            'expires_at' => 'nullable|date',
            'status' => 'sometimes|string|in:active,overdue,cancelled',
        ]);
        $subscription->update($validated);
        if (array_key_exists('expires_at', $validated) && $subscription->tenant) {
            $subscription->tenant->update(['subscription_ends_at' => $validated['expires_at']]);
        }
        return response()->json($subscription->fresh(['tenant:id,name,slug', 'plan:id,name,slug']));
    }
}
