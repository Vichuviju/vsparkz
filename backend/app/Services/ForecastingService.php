<?php

namespace App\Services;

use App\Models\ResourceForecast;
use App\Models\CampaignCapacitySnapshot;
use App\Models\HiringRequirement;
use App\Models\RevenueCapacityForecast;

class ForecastingService
{
    public function createResourceForecast(array $data, $tid = null): ResourceForecast
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return ResourceForecast::create($data);
    }

    public function listResourceForecasts($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return ResourceForecast::where('tenant_id', $tid)->get();
    }

    public function createCampaignCapacitySnapshot(array $data, $tid = null): CampaignCapacitySnapshot
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        $data['snapshot_date'] = $data['snapshot_date'] ?? now()->toDateString();
        return CampaignCapacitySnapshot::create($data);
    }

    public function createHiringRequirement(array $data, $tid = null): HiringRequirement
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return HiringRequirement::create($data);
    }

    public function createRevenueCapacityForecast(array $data, $tid = null): RevenueCapacityForecast
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return RevenueCapacityForecast::create($data);
    }
}
