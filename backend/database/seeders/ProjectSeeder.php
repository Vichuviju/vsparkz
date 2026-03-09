<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $clients = Client::with('agency')->limit(6)->get();
        if ($clients->isEmpty()) {
            return;
        }
        foreach ($clients as $client) {
            Project::updateOrCreate(
                ['client_id' => $client->id, 'name' => 'Campaign for ' . $client->company_name],
                [
                    'agency_id' => $client->agency_id,
                    'campaign_type' => 'seo',
                    'status' => 'active',
                    'start_date' => now()->subDays(30),
                    'end_date' => now()->addDays(60),
                ]
            );
        }
    }
}
