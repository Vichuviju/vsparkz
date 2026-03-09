<?php

namespace App\Http\Controllers\Admin\Platform;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImpersonateController extends PlatformBaseController
{
    /** POST /api/admin/platform/impersonate - super admin logs in as company admin of tenant. */
    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $validated = $request->validate(['tenant_id' => 'required|exists:tenants,id']);
        $tenant = Tenant::findOrFail($validated['tenant_id']);
        $user = User::where('tenant_id', $tenant->id)
            ->whereIn('role', ['agency_admin', 'agency_staff', 'admin'])
            ->first();
        if (! $user) {
            $user = User::where('tenant_id', $tenant->id)->first();
        }
        if (! $user) {
            return response()->json(['message' => 'No user found for this tenant.'], 404);
        }
        $user->tokens()->delete();
        $token = $user->createToken('auth-token', ['impersonate' => (string) $tenant->id])->plainTextToken;
        $user->loadMissing('roles');
        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->effective_role,
                'tenant_id' => $user->tenant_id,
                'client_id' => $user->client_id,
            ],
            'impersonating' => true,
            'tenant_name' => $tenant->company_name ?? $tenant->name,
        ]);
    }
}
