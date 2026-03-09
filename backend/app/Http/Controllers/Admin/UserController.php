<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\SaaSQuotaExceededException;
use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /** Team roles that can be managed via this controller. */
    private const MANAGED_ROLES = [
        Role::SLUG_SUPER_ADMIN,
        Role::SLUG_AGENCY_ADMIN,
        Role::SLUG_AGENCY_STAFF,
    ];

    private function scopeQuery()
    {
        $query = User::query()->with(['tenant:id,name,slug', 'roles:id,name,slug'])
            ->orderBy('name');

        $me = auth()->user();
        if (! $me->isSuperAdmin()) {
            $tid = $me->tenant_id ?? $me->agency_id;
            if ($tid) $query->where('tenant_id', $tid);
        }

        return $query;
    }

    private function canManageRole(string $roleSlug): bool
    {
        $me = auth()->user();
        if ($me->isSuperAdmin()) {
            return in_array($roleSlug, self::MANAGED_ROLES, true);
        }
        if ($me->effective_role === Role::SLUG_AGENCY_ADMIN) {
            return in_array($roleSlug, [Role::SLUG_AGENCY_ADMIN, Role::SLUG_AGENCY_STAFF], true);
        }
        return false;
    }

    private function canManageUser(User $user): bool
    {
        $me = auth()->user();
        if ($me->id === $user->id) {
            return true; // can edit self (e.g. name); destroy blocked separately
        }
        if ($me->isSuperAdmin()) {
            return true;
        }
        $tid = $me->tenant_id ?? $me->agency_id;
        if ($me->effective_role === Role::SLUG_AGENCY_ADMIN && $tid) {
            return (int) ($user->tenant_id ?? $user->agency_id) === (int) $tid;
        }
        return false;
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->scopeQuery()->whereIn('role', self::MANAGED_ROLES);

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }
        if ($request->filled('agency_id')) {
            $query->where('tenant_id', $request->agency_id);
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = min(max($perPage, 1), 100);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $me = auth()->user();
        $roleSlug = $request->input('role', Role::SLUG_AGENCY_STAFF);
        if (! $this->canManageRole($roleSlug)) {
            throw ValidationException::withMessages(['role' => ['You cannot assign this role.']]);
        }

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'required|string|in:' . implode(',', self::MANAGED_ROLES),
            'tenant_id' => 'nullable|exists:tenants,id',
            'agency_id' => 'nullable|exists:tenants,id',
        ];

        if ($roleSlug === Role::SLUG_SUPER_ADMIN) {
            $request->merge(['tenant_id' => null]);
        } elseif (! $me->isSuperAdmin()) {
            $request->merge(['tenant_id' => $me->tenant_id ?? $me->agency_id]);
            $rules['tenant_id'] = 'nullable';
        }

        $validated = $request->validate($rules);

        $tenantId = $validated['tenant_id'] ?? $validated['agency_id'] ?? null;
        if ($roleSlug !== Role::SLUG_SUPER_ADMIN && ! $tenantId && $me->isSuperAdmin()) {
            throw ValidationException::withMessages(['tenant_id' => ['Tenant is required for this role.']]);
        }
        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if ($tenant && $tenant->max_users !== null && $tenant->users()->count() >= $tenant->max_users) {
                throw new SaaSQuotaExceededException('User limit reached for your plan. Please upgrade.');
            }
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $roleSlug,
            'tenant_id' => $tenantId,
        ]);

        $role = Role::where('slug', $roleSlug)->first();
        if ($role) {
            $user->roles()->sync([$role->id]);
        }

        $user->load(['tenant:id,name,slug', 'roles:id,name,slug']);
        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        if (! $this->canManageUser($user)) {
            abort(403, 'You cannot view this user.');
        }
        $user->load(['tenant:id,name,slug', 'roles:id,name,slug']);
        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if (! $this->canManageUser($user)) {
            abort(403, 'You cannot edit this user.');
        }

        $me = auth()->user();
        $roleSlug = $request->input('role', $user->role);
        if (! $this->canManageRole($roleSlug)) {
            throw ValidationException::withMessages(['role' => ['You cannot assign this role.']]);
        }

        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => 'sometimes|string|in:' . implode(',', self::MANAGED_ROLES),
            'tenant_id' => 'nullable|exists:tenants,id',
            'agency_id' => 'nullable|exists:tenants,id',
        ];

        if ($roleSlug === Role::SLUG_SUPER_ADMIN) {
            $request->merge(['tenant_id' => null]);
        } elseif (! $me->isSuperAdmin()) {
            $request->merge(['tenant_id' => $me->tenant_id ?? $me->agency_id]);
        }

        $validated = $request->validate($rules);

        $tenantId = array_key_exists('tenant_id', $validated) ? ($validated['tenant_id'] ?? null) : (array_key_exists('agency_id', $validated) ? ($validated['agency_id'] ?? null) : null);
        $data = array_filter([
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'role' => $validated['role'] ?? null,
            'tenant_id' => $tenantId,
        ], fn ($v) => $v !== null);

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        if (isset($validated['role'])) {
            $role = Role::where('slug', $validated['role'])->first();
            if ($role) {
                $user->roles()->sync([$role->id]);
            }
        }

        $user->load(['agency:id,name,slug', 'roles:id,name,slug']);
        return response()->json($user);
    }

    public function destroy(User $user): JsonResponse
    {
        if (auth()->id() === $user->id) {
            throw ValidationException::withMessages(['user' => ['You cannot delete your own account.']]);
        }
        if (! $this->canManageUser($user)) {
            abort(403, 'You cannot delete this user.');
        }
        $user->tokens()->delete();
        $user->roles()->detach();
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}
