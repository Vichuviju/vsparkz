<?php

namespace App\Services;

use App\Models\ClientSubscription;
use App\Models\BillingCycle;
use App\Models\Transaction;

class BillingService
{
    public function createSubscription(array $data, ?int $tenantId = null): ClientSubscription
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        return ClientSubscription::create($data);
    }

    public function updateSubscription(ClientSubscription $sub, array $data): ClientSubscription
    {
        $sub->update($data);
        return $sub->fresh();
    }

    public function createBillingCycle(ClientSubscription $sub, array $data): BillingCycle
    {
        $data['client_subscription_id'] = $sub->id;
        return BillingCycle::create($data);
    }

    public function recordTransaction(array $data, ?int $tenantId = null): Transaction
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        $data['recorded_at'] = $data['recorded_at'] ?? now();
        return Transaction::create($data);
    }

    public function listSubscriptionsByClient(int $clientId)
    {
        return ClientSubscription::where('client_id', $clientId)->with('billingCycles')->get();
    }
}
