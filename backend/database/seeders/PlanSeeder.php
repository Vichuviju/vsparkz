<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['name' => 'Starter', 'type' => 'monthly', 'duration_days' => 30, 'price' => 4999, 'currency' => 'INR', 'is_active' => true],
            ['name' => 'Growth', 'type' => 'monthly', 'duration_days' => 30, 'price' => 9999, 'currency' => 'INR', 'is_active' => true],
            ['name' => 'Scale', 'type' => 'monthly', 'duration_days' => 30, 'price' => 19999, 'currency' => 'INR', 'is_active' => true],
        ];
        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
