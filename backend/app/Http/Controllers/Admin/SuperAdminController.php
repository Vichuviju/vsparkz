<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    private function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Super admin only.');
        }
    }

    /**
     * List all users (all roles) for super admin - e.g. for role assignment.
     * GET /api/admin/super-admin/users
     */
    public function users(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $query = User::with(['tenant:id,name,slug', 'roles:id,name,slug'])->orderBy('name');
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%");
            });
        }
        $perPage = min(max((int) $request->get('per_page', 50), 1), 500);
        $users = $query->paginate($perPage);
        return response()->json($users);
    }

    /**
     * Update a user's role (super admin only, any role).
     * PUT /api/admin/super-admin/users/{user}
     */
    public function updateUser(Request $request, User $user): JsonResponse
    {
        $this->ensureSuperAdmin();
        $request->validate([
            'role' => 'required|string|exists:roles,slug',
            'tenant_id' => 'nullable|exists:tenants,id',
            'agency_id' => 'nullable|exists:tenants,id',
        ]);
        $roleSlug = $request->role;
        $role = Role::where('slug', $roleSlug)->first();
        if (! $role) {
            abort(422, 'Invalid role');
        }
        $tenantId = $roleSlug === Role::SLUG_SUPER_ADMIN ? null : ($request->tenant_id ?? $request->agency_id);
        $user->update(['role' => $roleSlug, 'tenant_id' => $tenantId]);
        $user->roles()->sync([$role->id]);
        $user->load(['tenant:id,name,slug', 'roles:id,name,slug']);
        return response()->json($user);
    }

    /**
     * Dashboard stats for super admin: agencies, users by role, counts.
     * GET /api/admin/super-admin/dashboard
     */
    public function dashboard(): JsonResponse
    {
        $this->ensureSuperAdmin();

        $agencies = Tenant::orderBy('name')->get(['id', 'name', 'slug'])->map(function (Tenant $tenant) {
            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'users_count' => User::where('tenant_id', $tenant->id)->count(),
                'leads_count' => Lead::where('tenant_id', $tenant->id)->count(),
                'clients_count' => Client::where('tenant_id', $tenant->id)->count(),
                'projects_count' => Project::where('tenant_id', $tenant->id)->count(),
            ];
        });

        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => ['role' => $r->role, 'count' => (int) $r->count]);

        $totalUsers = User::count();
        $totalLeads = Lead::count();
        $totalClients = Client::count();
        $totalProjects = Project::count();

        $driver = DB::connection()->getDriverName();
        $dateFormat = $driver === 'sqlite' ? 'strftime("%Y-%m", paid_at)' : "DATE_FORMAT(paid_at, '%Y-%m')";
        $revenueByMonth = Payment::selectRaw("{$dateFormat} as month, SUM(amount) as revenue")
            ->where('paid_at', '>=', now()->subMonths(5)->startOfMonth())
            ->whereNotNull('paid_at')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'agencies' => $agencies,
            'users_by_role' => $usersByRole,
            'total_users' => $totalUsers,
            'total_leads' => $totalLeads,
            'total_clients' => $totalClients,
            'total_projects' => $totalProjects,
            'revenue_by_month' => $revenueByMonth,
        ]);
    }
}
