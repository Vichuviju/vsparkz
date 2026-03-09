<?php

namespace App\Http\Controllers\Admin\Platform;

use App\Models\Tenant;
use Illuminate\Http\JsonResponse;

class TenantUsageController extends PlatformBaseController
{
    /** GET /api/admin/platform/tenants/{tenant}/usage */
    public function show(Tenant $tenant): JsonResponse
    {
        $this->ensureSuperAdmin();
        $tenant->loadCount(['users', 'leads', 'clients', 'projects']);
        return response()->json([
            'tenant_id' => $tenant->id,
            'users_count' => $tenant->users_count,
            'leads_count' => $tenant->leads_count,
            'clients_count' => $tenant->clients_count,
            'projects_count' => $tenant->projects_count,
            'max_users' => $tenant->max_users,
            'max_clients' => $tenant->max_clients,
            'max_projects' => $tenant->max_projects,
        ]);
    }
}
