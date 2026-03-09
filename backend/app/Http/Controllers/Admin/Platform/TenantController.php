<?php

namespace App\Http\Controllers\Admin\Platform;

use App\Mail\TenantOnboardingInvite;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TenantController extends PlatformBaseController
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $query = Tenant::query()->with(['plan:id,name,slug'])->orderBy('name');
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('company_name', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }
        $tenants = $query->paginate($request->get('per_page', 15));
        return response()->json($tenants);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin();
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'slug' => 'required|string|max:100|unique:tenants,slug',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:50',
            'logo_url' => 'nullable|string|max:500',
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'max_users' => 'nullable|integer|min:1',
            'max_clients' => 'nullable|integer|min:0',
            'max_projects' => 'nullable|integer|min:0',
            'feature_flags' => 'nullable|array',
            'trial_ends_at' => 'nullable|date',
            'subscription_ends_at' => 'nullable|date',
            'create_login' => 'nullable|boolean',
            'send_invite_email' => 'nullable|boolean',
        ]);
        $validated['name'] = $validated['name'] ?? $validated['company_name'];
        $validated['status'] = Tenant::STATUS_ACTIVE;
        $createLogin = $validated['create_login'] ?? true;
        $sendInvite = $validated['send_invite_email'] ?? true;
        unset($validated['create_login'], $validated['send_invite_email']);

        $tenant = DB::transaction(function () use ($validated, $createLogin, $sendInvite) {
            $tenant = Tenant::create($validated);
            if ($createLogin) {
                $role = Role::where('slug', Role::SLUG_AGENCY_ADMIN)->first();
                $tempPassword = Str::random(12);
                $user = User::create([
                    'name' => $validated['company_name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($tempPassword),
                    'role' => $role?->slug ?? 'agency_admin',
                    'tenant_id' => $tenant->id,
                ]);
                if ($role) {
                    $user->roles()->sync([$role->id]);
                }
                $tenant->setRelation('companyAdmin', $user);
                if ($sendInvite) {
                    $loginUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/login';
                    Mail::to($validated['email'])->send(new TenantOnboardingInvite(
                        $validated['company_name'],
                        $validated['email'],
                        $tempPassword,
                        $loginUrl
                    ));
                }
            }
            return $tenant->load(['plan:id,name,slug']);
        });

        return response()->json($tenant, 201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $this->ensureSuperAdmin();
        $tenant->load(['plan:id,name,slug,price_monthly,price_yearly,max_clients,max_projects,max_users']);
        $tenant->loadCount(['users', 'leads', 'clients', 'projects']);
        return response()->json($tenant);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $this->ensureSuperAdmin();
        $validated = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:100|unique:tenants,slug,' . $tenant->id,
            'email' => 'sometimes|email',
            'phone' => 'nullable|string|max:50',
            'logo_url' => 'nullable|string|max:500',
            'status' => 'sometimes|string|in:active,suspended,expired',
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'max_users' => 'nullable|integer|min:1',
            'max_clients' => 'nullable|integer|min:0',
            'max_projects' => 'nullable|integer|min:0',
            'feature_flags' => 'nullable|array',
            'trial_ends_at' => 'nullable|date',
            'subscription_ends_at' => 'nullable|date',
        ]);
        $tenant->update($validated);
        return response()->json($tenant->fresh(['plan:id,name,slug']));
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        $this->ensureSuperAdmin();
        $tenant->delete();
        return response()->json(['message' => 'Tenant deleted']);
    }
}
