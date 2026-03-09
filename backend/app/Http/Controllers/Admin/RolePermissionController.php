<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    private function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Super admin only.');
        }
    }

    /**
     * List all roles with their permission ids.
     * GET /api/admin/roles-with-permissions
     */
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $roles = Role::orderBy('name')->with('permissions:id')->get()->map(function (Role $role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'permission_ids' => $role->permissions->pluck('id')->values()->all(),
            ];
        });
        return response()->json($roles);
    }

    /**
     * List all permissions.
     * GET /api/admin/permissions
     */
    public function permissions(): JsonResponse
    {
        $this->ensureSuperAdmin();
        $permissions = Permission::orderBy('slug')->get(['id', 'name', 'slug']);
        return response()->json($permissions);
    }

    /**
     * Update permissions for a role.
     * PUT /api/admin/roles/{role}/permissions
     */
    public function updatePermissions(Request $request, Role $role): JsonResponse
    {
        $this->ensureSuperAdmin();
        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);
        $role->permissions()->sync($request->permission_ids);
        $role->load('permissions:id,name,slug');
        return response()->json($role);
    }
}
