<?php

namespace Database\Seeders;

use App\Models\Agreement;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Database\Seeder;

class AgreementSeeder extends Seeder
{
    public function run(): void
    {
        $clients = Client::limit(3)->get();
        $projects = Project::limit(2)->get();
        if ($clients->isEmpty()) {
            return;
        }
        foreach ($clients as $idx => $client) {
            $project = $projects->get($idx);
            Agreement::updateOrCreate(
                ['client_id' => $client->id, 'title' => 'Agreement ' . $client->id],
                [
                    'project_id' => $project?->id,
                    'scope' => 'SEO and content.',
                    'timeline' => '6 months',
                    'payment_terms' => 'Net 15',
                    'status' => $idx === 0 ? 'signed' : 'draft',
                ]
            );
        }
    }
}
