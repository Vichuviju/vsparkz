<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\CampaignAudience;
use App\Models\CampaignBudget;
use App\Models\CampaignChannel;
use App\Models\CampaignKpi;
use App\Models\CampaignMilestone;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    /**
     * Create or update a campaign with optional child records.
     *
     * @param array<string, mixed> $data
     * @param Campaign|null $campaign
     */
    public function save(array $data, ?Campaign $campaign = null): Campaign
    {
        return DB::transaction(function () use ($data, $campaign) {
            $campaignData = $data['campaign'] ?? $data;

            /** @var Campaign $model */
            $model = $campaign
                ? tap($campaign)->update($campaignData)
                : Campaign::create($campaignData);

            $this->syncChildCollection($model, $data['kpis'] ?? [], CampaignKpi::class);
            $this->syncChildCollection($model, $data['channels'] ?? [], CampaignChannel::class);
            $this->syncChildCollection($model, $data['audiences'] ?? [], CampaignAudience::class);
            $this->syncChildCollection($model, $data['budgets'] ?? [], CampaignBudget::class);
            $this->syncChildCollection($model, $data['milestones'] ?? [], CampaignMilestone::class);

            if (! empty($data['spawn_project'])) {
                $this->spawnProjectFromCampaign($model, $data['project'] ?? []);
            }

            return $model->fresh([
                'project',
                'clientRelation',
            ]);
        });
    }

    /**
     * @param class-string<Model> $modelClass
     * @param array<int, array<string, mixed>> $items
     */
    protected function syncChildCollection(Campaign $campaign, array $items, string $modelClass): void
    {
        if ($items === []) {
            return;
        }

        /** @var Model $model */
        $model = new $modelClass();
        $table = $model->getTable();

        foreach ($items as $item) {
            $attributes = array_merge($item, [
                'campaign_id' => $campaign->id,
                'tenant_id' => $campaign->tenant_id,
            ]);

            if (isset($attributes['id'])) {
                $id = $attributes['id'];
                unset($attributes['id']);
                DB::table($table)->where('id', $id)->update($attributes);
            } else {
                DB::table($table)->insert($attributes);
            }
        }
    }

    /**
     * Optionally spawn a project linked to this campaign.
     *
     * @param array<string, mixed> $projectData
     */
    protected function spawnProjectFromCampaign(Campaign $campaign, array $projectData = []): ?Project
    {
        $clientId = $campaign->client_id;

        if (! $clientId && isset($projectData['client_id'])) {
            $clientId = (int) $projectData['client_id'];
        }

        if (! $clientId) {
            return null;
        }

        /** @var Client|null $client */
        $client = Client::find($clientId);
        if (! $client) {
            return null;
        }

        $projectAttributes = array_merge([
            'client_id' => $client->id,
            'name' => $campaign->name,
            'campaign_type' => $campaign->campaign_type,
        ], $projectData);

        /** @var Project $project */
        $project = Project::create($projectAttributes);

        return $project;
    }
}

