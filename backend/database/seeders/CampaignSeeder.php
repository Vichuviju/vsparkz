<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        $projects = Project::with('client')->limit(2)->get();
        if ($projects->isEmpty()) {
            return;
        }
        foreach ($projects as $idx => $project) {
            Campaign::updateOrCreate(
                ['project_id' => $project->id, 'name' => 'Campaign ' . ($idx + 1)],
                [
                    'client_id' => $project->client_id,
                    'campaign_type' => 'influencer',
                    'status' => 'active',
                    'influencer_name' => 'Influencer One',
                    'platform' => 'Instagram',
                    'start_date' => now(),
                    'end_date' => now()->addDays(90),
                ]
            );
        }
    }
}
