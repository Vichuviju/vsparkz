<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Freelancer;
use Illuminate\Database\Seeder;

class FreelancerSeeder extends Seeder
{
    public function run(): void
    {
        $agencies = Agency::all();
        if ($agencies->isEmpty()) {
            return;
        }
        foreach ($agencies as $agency) {
            Freelancer::updateOrCreate(
                ['email' => 'fl' . $agency->id . '@example.com'],
                [
                    'agency_id' => $agency->id,
                    'name' => 'Freelancer ' . $agency->id,
                    'delivery_days' => 7,
                    'is_active' => true,
                ]
            );
        }
    }
}
