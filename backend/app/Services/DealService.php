<?php

namespace App\Services;

use App\Models\Deal;
use App\Models\DealActivity;
use App\Models\DealStage;
use App\Models\ForecastSnapshot;

class DealService
{
    public function createDeal(array $data, ?int $tenantId = null): Deal
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $data['tenant_id'] = $tenantId;
        $default = DealStage::where('tenant_id', $tenantId)->where('is_default', true)->first();
        if ($default && empty($data['current_stage_id'])) {
            $data['current_stage_id'] = $default->id;
        }
        return Deal::create($data);
    }

    public function updateDeal(Deal $deal, array $data): Deal
    {
        $deal->update($data);
        return $deal->fresh();
    }

    public function addActivity(Deal $deal, array $data): DealActivity
    {
        $data['deal_id'] = $deal->id;
        $data['tenant_id'] = $deal->tenant_id;
        return DealActivity::create($data);
    }

    public function recordForecastSnapshot(int $tenantId, string $pipelineName, array $totals): ForecastSnapshot
    {
        return ForecastSnapshot::create([
            'tenant_id' => $tenantId,
            'snapshot_date' => now()->toDateString(),
            'pipeline_name' => $pipelineName,
            'total_pipeline_value' => $totals['total'] ?? 0,
            'weighted_pipeline_value' => $totals['weighted'] ?? 0,
            'expected_revenue_next_30d' => $totals['next_30d'] ?? null,
            'expected_revenue_next_90d' => $totals['next_90d'] ?? null,
        ]);
    }
}
