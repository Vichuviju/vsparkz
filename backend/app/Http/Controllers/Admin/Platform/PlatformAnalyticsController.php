<?php

namespace App\Http\Controllers\Admin\Platform;

use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PlatformAnalyticsController extends PlatformBaseController
{
    public function index(): JsonResponse
    {
        $this->ensureSuperAdmin();

        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', Tenant::STATUS_ACTIVE)->count();
        $expiredTenants = Tenant::where('status', Tenant::STATUS_EXPIRED)->count();
        $suspendedTenants = Tenant::where('status', Tenant::STATUS_SUSPENDED)->count();

        $mrr = Subscription::where('subscriptions.status', Subscription::STATUS_ACTIVE)
            ->join('subscription_plans', 'subscriptions.plan_id', '=', 'subscription_plans.id')
            ->selectRaw("SUM(CASE WHEN subscriptions.billing_cycle = 'yearly' THEN COALESCE(subscription_plans.price_yearly, 0) / 12 ELSE COALESCE(subscription_plans.price_monthly, 0) END) as total")
            ->value('total');
        $mrr = round((float) $mrr, 2);

        $planDistribution = Tenant::whereNotNull('plan_id')
            ->select('plan_id', DB::raw('count(*) as count'))
            ->groupBy('plan_id')
            ->get();
        $planIds = $planDistribution->pluck('plan_id')->unique()->all();
        $plans = \App\Models\SubscriptionPlan::whereIn('id', $planIds)->get()->keyBy('id');
        $planDistribution = $planDistribution->map(fn ($r) => [
            'plan_id' => $r->plan_id,
            'plan_name' => $plans->get($r->plan_id)?->name ?? '—',
            'count' => $r->count,
        ])->values()->all();

        $usageLoad = Tenant::withCount(['users', 'clients', 'projects'])
            ->orderByDesc('projects_count')
            ->limit(10)
            ->get(['id', 'name', 'slug']);

        return response()->json([
            'total_tenants' => $totalTenants,
            'active_tenants' => $activeTenants,
            'expired_tenants' => $expiredTenants,
            'suspended_tenants' => $suspendedTenants,
            'mrr' => $mrr,
            'plan_distribution' => $planDistribution,
            'usage_load' => $usageLoad,
        ]);
    }
}
