<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    /**
     * Create 2–3 tenants with plan_id and status. Runs after SubscriptionPlanSeeder.
     */
    public function run(): void
    {
        $plans = SubscriptionPlan::orderBy('sort_order')->get();
        $defaultPlanId = $plans->first()?->id;

        $tenants = [
            [
                'name' => 'V-Sparkz HQ',
                'company_name' => 'V-Sparkz Digital',
                'slug' => 'vsparkz-hq',
                'email' => 'contact@vsparkzdigital.com',
                'phone' => null,
                'primary_color' => '#0ea5e9',
                'status' => Tenant::STATUS_ACTIVE,
            ],
            [
                'name' => 'Agency Alpha',
                'company_name' => 'Agency Alpha Inc',
                'slug' => 'agency-alpha',
                'email' => 'hello@agencyalpha.com',
                'phone' => null,
                'primary_color' => '#8b5cf6',
                'status' => Tenant::STATUS_ACTIVE,
            ],
            [
                'name' => 'Demo Tenant',
                'company_name' => 'Demo Co',
                'slug' => 'demo-tenant',
                'email' => 'demo@example.com',
                'phone' => null,
                'primary_color' => '#10b981',
                'status' => Tenant::STATUS_ACTIVE,
            ],
        ];

        foreach ($tenants as $t) {
            Tenant::updateOrCreate(
                ['slug' => $t['slug']],
                array_merge($t, [
                    'plan_id' => $defaultPlanId,
                    'subscription_id' => null,
                    'logo_url' => null,
                    'domain' => null,
                    'settings' => null,
                    'max_users' => null,
                    'max_clients' => null,
                    'max_projects' => null,
                    'feature_flags' => null,
                    'trial_ends_at' => null,
                    'subscription_ends_at' => null,
                ])
            );
        }
    }
}
