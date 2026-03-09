<?php

namespace App\Services;

use App\Models\ProfitabilitySnapshot;
use App\Models\Project;
use App\Models\ResourceCost;
use App\Models\TimeLog;
use Carbon\Carbon;

class ProfitabilityService
{
    public function calculateProjectProfitability(Project $project, Carbon $periodStart, Carbon $periodEnd): ProfitabilitySnapshot
    {
        $tenantId = $project->tenant_id;
        $costAmount = 0.0;
        $logs = TimeLog::where('project_id', $project->id)->whereBetween('started_at', [$periodStart, $periodEnd])->get();
        foreach ($logs as $log) {
            $hours = $log->minutes / 60.0;
            $rate = ResourceCost::where('tenant_id', $tenantId)->where('user_id', $log->user_id)->value('hourly_cost');
            if ($rate !== null) {
                $costAmount += $hours * (float) $rate;
            }
        }
        $revenueAmount = (float) $project->client->invoices()->whereNotNull('paid_at')->whereBetween('paid_at', [$periodStart, $periodEnd])->sum('total');
        $marginAmount = $revenueAmount - $costAmount;
        $marginPct = $revenueAmount > 0 ? round(($marginAmount / $revenueAmount) * 100, 2) : null;

        return ProfitabilitySnapshot::create([
            'tenant_id' => $tenantId,
            'project_id' => $project->id,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'revenue_amount' => $revenueAmount,
            'cost_amount' => $costAmount,
            'margin_amount' => $marginAmount,
            'margin_percentage' => $marginPct,
            'calculation_basis' => 'time_cost_vs_invoices',
        ]);
    }
}
