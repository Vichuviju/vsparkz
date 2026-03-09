<?php

namespace App\Services;

use App\Models\AdMetricsDaily;
use App\Models\Campaign;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\ProfitabilitySnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function campaignRoi(?int $tenantId, ?int $campaignId, Carbon $from, Carbon $to): array
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $q = AdMetricsDaily::where('tenant_id', $tenantId)->whereBetween('date', [$from, $to]);
        if ($campaignId) {
            $q->where('internal_campaign_id', $campaignId);
        }
        $metrics = $q->selectRaw('SUM(impressions) as impressions, SUM(clicks) as clicks, SUM(spend) as spend, SUM(conversions) as conversions')->first();
        $profit = ProfitabilitySnapshot::where('tenant_id', $tenantId)->whereBetween('period_start', [$from, $to]);
        if ($campaignId) {
            $profit->where('campaign_id', $campaignId);
        }
        $profit = $profit->selectRaw('SUM(revenue_amount) as revenue, SUM(cost_amount) as cost')->first();
        return [
            'impressions' => (int) ($metrics->impressions ?? 0),
            'clicks' => (int) ($metrics->clicks ?? 0),
            'spend' => (float) ($metrics->spend ?? 0),
            'conversions' => (int) ($metrics->conversions ?? 0),
            'revenue' => (float) ($profit->revenue ?? 0),
            'cost' => (float) ($profit->cost ?? 0),
        ];
    }

    public function channelPerformance(?int $tenantId, Carbon $from, Carbon $to): array
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $leads = Lead::where('tenant_id', $tenantId)->whereBetween('created_at', [$from, $to])->selectRaw('source, count(*) as cnt')->groupBy('source')->pluck('cnt', 'source');
        $revenue = Payment::whereHas('invoice.client', fn ($q) => $q->where('tenant_id', $tenantId))
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$from, $to])
            ->sum('amount');
        return [
            'leads_by_source' => $leads->toArray(),
            'revenue' => (float) $revenue,
        ];
    }

    public function pipelineSummary(?int $tenantId): array
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $total = Deal::where('tenant_id', $tenantId)->sum('amount');
        $weighted = Deal::where('tenant_id', $tenantId)->selectRaw('SUM(amount * COALESCE(probability/100, 0)) as w')->value('w');
        return [
            'total_pipeline_value' => (float) $total,
            'weighted_pipeline_value' => (float) ($weighted ?? 0),
        ];
    }
}
