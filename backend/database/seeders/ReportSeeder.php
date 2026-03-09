<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Report;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $clients = Client::limit(3)->get();
        if ($clients->isEmpty()) {
            return;
        }
        foreach ($clients as $client) {
            Report::updateOrCreate(
                [
                    'reference_id' => $client->id,
                    'type' => Report::TYPE_CLIENT,
                ],
                [
                    'title' => 'Monthly Report - ' . $client->company_name,
                    'payload' => [
                        'visits' => 1200,
                        'conversions' => 45,
                        'status' => 'generated',
                        'generated_at' => now()->subDays(10)->toIso8601String(),
                    ],
                ]
            );
        }
    }
}
