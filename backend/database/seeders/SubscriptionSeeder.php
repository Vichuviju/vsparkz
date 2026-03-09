<?php

namespace Database\Seeders;

use App\Models\Subscription;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SubscriptionSeeder extends Seeder
{
    /**
     * Create subscriptions for seeded tenants. Runs after TenantSeeder.
     */
    public function run(): void
    {
        $tenants = Tenant::whereNotNull('plan_id')->get();

        foreach ($tenants as $tenant) {
            $existing = Subscription::where('tenant_id', $tenant->id)->where('status', Subscription::STATUS_ACTIVE)->first();
            if ($existing) {
                continue;
            }

            $started = Carbon::now()->subMonths(1);
            $expires = Carbon::now()->addMonths(11);

            $sub = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $tenant->plan_id,
                'billing_cycle' => Subscription::BILLING_YEARLY,
                'started_at' => $started,
                'expires_at' => $expires,
                'status' => Subscription::STATUS_ACTIVE,
                'trial_ends_at' => null,
            ]);

            $tenant->update(['subscription_id' => $sub->id]);
        }
    }
}
