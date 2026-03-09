<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\BaseController;
use App\Models\Lead;
use App\Models\Service;
use App\Models\Client;
use App\Models\Project;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseController
{
    /**
     * Dashboard analytics with charts data: leads, clients, projects, revenue, funnel, source.
     * GET /api/admin/dashboard
     */
    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);

        // Leads
        $totalLeads = Lead::when($tenantId, fn($q) => $q->forTenant($tenantId))->count();
        $leadsThisMonth = Lead::when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $topServiceRow = Lead::when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->whereNotNull('service_id')
            ->select('service_id', DB::raw('count(*) as total'))
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->first();
        $topService = $topServiceRow ? [
            'service_id' => $topServiceRow->service_id,
            'title' => Service::find($topServiceRow->service_id)?->title,
            'count' => (int) $topServiceRow->total,
        ] : null;
        $recentEnquiries = Lead::when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->with('service:id,title')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // Funnel
        $funnel = Lead::when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Leads by source
        $bySource = Lead::when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->select('source', DB::raw('count(*) as count'))
            ->whereNotNull('source')
            ->where('source', '!=', '')
            ->groupBy('source')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Clients & Projects
        $totalClients = Client::when($tenantId, fn($q) => $q->forTenant($tenantId))->count();
        $activeProjects = Project::when($tenantId, fn($q) => $q->forTenant($tenantId))
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        // Revenue by month (last 6 months) – SQLite and MySQL compatible
        $driver = DB::connection()->getDriverName();
        $dateFormat = $driver === 'sqlite' ? 'strftime("%Y-%m", paid_at)' : "DATE_FORMAT(paid_at, '%Y-%m')";
        $revenueByMonth = Payment::when($tenantId, function ($query) use ($tenantId) {
                $query->whereHas('invoice.client', fn($q) => $q->where('tenant_id', $tenantId));
            })
            ->selectRaw("{$dateFormat} as month, SUM(amount) as revenue")
            ->where('paid_at', '>=', now()->subMonths(5)->startOfMonth())
            ->whereNotNull('paid_at')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'total_leads' => $totalLeads,
            'leads_this_month' => $leadsThisMonth,
            'total_clients' => $totalClients,
            'active_projects' => $activeProjects,
            'top_requested_service' => $topService,
            'recent_enquiries' => $recentEnquiries,
            'funnel' => $funnel,
            'leads_by_source' => $bySource,
            'revenue_by_month' => $revenueByMonth,
        ]);
    }
}
