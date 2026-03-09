<?php

namespace Database\Seeders;

use App\Models\Influencer;
use Illuminate\Database\Seeder;

class InfluencerSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Influencer One', 'platform' => 'Instagram', 'followers' => 50000, 'engagement_rate' => 4.5, 'status' => 'new'],
            ['name' => 'Influencer Two', 'platform' => 'YouTube', 'followers' => 100000, 'engagement_rate' => 3.2, 'status' => 'shortlisted'],
        ];
        foreach ($items as $i) {
            Influencer::updateOrCreate(
                ['name' => $i['name'], 'platform' => $i['platform']],
                array_merge($i, ['email' => null, 'phone' => null, 'language' => 'en', 'location' => 'India', 'category' => 'lifestyle'])
            );
        }
    }
}
