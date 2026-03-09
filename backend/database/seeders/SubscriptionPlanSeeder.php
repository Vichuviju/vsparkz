<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['name' => 'Starter', 'slug' => 'starter', 'price_monthly' => 4999, 'price_yearly' => 49990, 'max_clients' => 25, 'max_projects' => 50, 'max_users' => 5, 'sort_order' => 1],
            ['name' => 'Growth', 'slug' => 'growth', 'price_monthly' => 9999, 'price_yearly' => 99990, 'max_clients' => 100, 'max_projects' => 200, 'max_users' => 15, 'sort_order' => 2],
            ['name' => 'Pro', 'slug' => 'pro', 'price_monthly' => 19999, 'price_yearly' => 199990, 'max_clients' => 500, 'max_projects' => 1000, 'max_users' => 50, 'sort_order' => 3],
            ['name' => 'Enterprise', 'slug' => 'enterprise', 'price_monthly' => null, 'price_yearly' => null, 'max_clients' => null, 'max_projects' => null, 'max_users' => null, 'sort_order' => 4],
        ];

        foreach ($plans as $p) {
            SubscriptionPlan::firstOrCreate(
                ['slug' => $p['slug']],
                array_merge($p, ['is_active' => true])
            );
        }
    }
}
