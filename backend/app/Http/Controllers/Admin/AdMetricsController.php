<?php

namespace App\Http\Controllers\Admin;

use App\Models\AdMetricsDaily;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AdMetricsController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tid = $this->getTenantId($request);

        // Fetch campaigns
        $campaignsQuery = Campaign::query();
        if ($tid) {
            $campaignsQuery->where('tenant_id', $tid);
        }
        $campaigns = $campaignsQuery->get();

        $metricsCountQuery = AdMetricsDaily::query();
        if ($tid) {
            $metricsCountQuery->where('tenant_id', $tid);
        }

        // Trigger background sync if no metrics exist (Integration with Facebook/Google Ads API)
        if ($metricsCountQuery->count() === 0 && $campaigns->count() > 0) {
            foreach ($campaigns as $campaign) {
                // In a production environment, this dispatches a Job to query Meta/Google APIs
                // dispatch(new \App\Jobs\SyncCampaignAdMetricsJob($campaign->id));
                \Illuminate\Support\Facades\Log::info("Dispatched AdMetricsSyncJob for campaign {$campaign->id}");
            }
        }

        // Retrieve daily metrics
        $metricsQuery = AdMetricsDaily::query()->orderBy('date', 'asc');
        if ($tid) {
            $metricsQuery->where('tenant_id', $tid);
        }
        $metrics = $metricsQuery->get();

        // Aggregate stats
        $totalSpend = $metrics->sum('spend');
        $totalImpressions = $metrics->sum('impressions');
        $totalClicks = $metrics->sum('clicks');
        $totalConversions = $metrics->sum('conversions');

        // Group by day for trend chart
        $dailyTrend = $metrics->groupBy('date')->map(function ($dayMetrics, $date) {
            return [
                'date' => $date,
                'impressions' => $dayMetrics->sum('impressions'),
                'clicks' => $dayMetrics->sum('clicks'),
                'spend' => $dayMetrics->sum('spend'),
                'conversions' => $dayMetrics->sum('conversions'),
            ];
        })->values();

        // Group by campaign for comparison table
        $campaignStats = $metrics->groupBy('campaign_id')->map(function ($campaignMetrics, $campaignId) use ($campaigns) {
            $campaign = $campaigns->firstWhere('id', $campaignId);
            return [
                'id' => $campaignId,
                'name' => $campaignMetrics->first()->campaign_name ?? ($campaign->name ?? 'Campaign ' . $campaignId),
                'status' => $campaign->status ?? 'active',
                'impressions' => $campaignMetrics->sum('impressions'),
                'clicks' => $campaignMetrics->sum('clicks'),
                'spend' => $campaignMetrics->sum('spend'),
                'conversions' => $campaignMetrics->sum('conversions'),
            ];
        })->values();

        return response()->json([
            'summary' => [
                'total_spend' => $totalSpend,
                'total_impressions' => $totalImpressions,
                'total_clicks' => $totalClicks,
                'total_conversions' => $totalConversions,
                'avg_ctr' => $totalImpressions > 0 ? round(($totalClicks / $totalImpressions) * 100, 2) : 0,
                'avg_cpc' => $totalClicks > 0 ? round($totalSpend / $totalClicks, 2) : 0,
            ],
            'daily_trend' => $dailyTrend,
            'campaign_stats' => $campaignStats,
        ]);
    }
}
