<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Project;
use App\Models\RequirementGathering;
use App\Models\Service;
use Illuminate\Database\Seeder;

class RequirementGatheringSeeder extends Seeder
{
    public function run(): void
    {
        $projects = Project::with('client')->has('client')->limit(3)->get();
        $serviceIds = Service::limit(2)->pluck('id')->toArray();
        if ($projects->isEmpty()) {
            return;
        }
        foreach ($projects as $project) {
            RequirementGathering::updateOrCreate(
                [
                    'client_id' => $project->client_id,
                    'project_id' => $project->id,
                ],
                [
                    'service_ids' => $serviceIds,
                    'expectations' => 'Increase organic traffic and improve rankings.',
                    'selected_requirements' => [],
                ]
            );
        }
    }
}
