<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\StrategyReport;
use Illuminate\Database\Seeder;

class StrategyReportSeeder extends Seeder
{
    public function run(): void
    {
        $clients = Client::limit(3)->get();
        if ($clients->isEmpty()) {
            return;
        }
        foreach ($clients as $idx => $client) {
            StrategyReport::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'version' => 1,
                ],
                [
                    'project_id' => null,
                    'status' => $idx === 0 ? 'approved' : 'sent',
                    'estimated_budget' => 50000,
                    'content' => 'Strategy overview: SEO focus, content calendar, and link building.',
                ]
            );
        }
    }
}
