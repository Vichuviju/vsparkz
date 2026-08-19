<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\Payroll;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HRMSEmployeeController extends Controller
{
    /** Roles that are considered "employee" for HRMS management. */
    private const EMPLOYEE_ROLES = [
        User::ROLE_EMPLOYEE,
        User::ROLE_AGENCY_STAFF,
        User::ROLE_PROJECT_MANAGER,
    ];

    private function scopeQuery()
    {
        $query = User::query()
            ->with(['roles:id,name,slug', 'hrmsDepartment:id,name,code'])
            ->whereIn('role', self::EMPLOYEE_ROLES)
            ->orderBy('name');

        $me = auth()->user();
        if (!$me->isSuperAdmin()) {
            $tid = $me->tenant_id ?? $me->agency_id;
            if ($tid) {
                $query->where('tenant_id', $tid);
            }
        }
        return $query;
    }

    /** Format a user as an employee response. */
    private function formatEmployee(User $user): array
    {
        return [
            'id' => $user->id,
            'empCode' => $user->emp_code,
            'firstName' => Str::before($user->name, ' '),
            'lastName' => Str::after($user->name, ' '),
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'designation' => $user->designation,
            'department' => $user->hrmsDepartment?->name ?? $user->department,
            'departmentId' => $user->hrms_department_id,
            'status' => $user->employment_status,
            'dateOfBirth' => $user->date_of_birth?->toDateString(),
            'dateOfJoining' => $user->date_of_joining?->toDateString(),
            'profileImage' => $user->profile_image,
            'gender' => $user->gender,
            'bloodGroup' => $user->blood_group,
            'address' => $user->address,
            'emergencyContact' => $user->emergency_contact,
            'basicSalary' => $user->basic_salary,
            'bankAccount' => $user->bank_account,
            'ifscCode' => $user->ifsc_code,
            'panNumber' => $user->pan_number,
            'aadhaarNumber' => $user->aadhaar_number,
            'pfNumber' => $user->pf_number,
            'esiNumber' => $user->esi_number,
            'tenantId' => $user->tenant_id,
            'createdAt' => $user->created_at,
        ];
    }

    /** GET /admin/hrms/employees */
    public function index(Request $request): JsonResponse
    {
        $query = $this->scopeQuery();

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('emp_code', 'like', "%{$q}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('employment_status', $request->status);
        }

        if ($request->filled('department_id')) {
            $query->where('hrms_department_id', $request->department_id);
        }

        $employees = $query->get()->map(fn($u) => $this->formatEmployee($u));

        return response()->json(['data' => $employees]);
    }

    /** GET /admin/hrms/employees/unlinked-users */
    public function unlinkedUsers(): JsonResponse
    {
        $me = auth()->user();
        // Unlinked = users that have no HRMS role (could be clients, influencers, or plain users)
        $query = User::query()
            ->whereNotIn('role', self::EMPLOYEE_ROLES)
            ->whereNotIn('role', ['client', 'influencer', 'super_admin'])
            ->orderBy('name');

        if (!$me->isSuperAdmin()) {
            $tid = $me->tenant_id ?? $me->agency_id;
            if ($tid) {
                $query->where('tenant_id', $tid);
            }
        }

        $users = $query->get()->map(fn($u) => [
            'id' => $u->id,
            'firstName' => Str::before($u->name, ' '),
            'lastName' => Str::after($u->name, ' '),
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
        ]);

        return response()->json($users);
    }

    /** GET /admin/hrms/employees/{id} */
    public function show(User $employee): JsonResponse
    {
        $employee->load(['roles:id,name,slug', 'hrmsDepartment:id,name,code']);

        // Also load recent leaves and payroll
        $leaves = Leave::where('user_id', $employee->id)->latest()->take(5)->get();
        $payrolls = Payroll::where('user_id', $employee->id)->latest()->take(3)->get();

        $data = $this->formatEmployee($employee);
        $data['leaves'] = $leaves;
        $data['payrolls'] = $payrolls;

        return response()->json(['data' => $data]);
    }

    /** POST /admin/hrms/employees */
    public function store(Request $request): JsonResponse
    {
        $me = auth()->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'emp_code' => 'nullable|string|max:50|unique:users,emp_code',
            'employment_status' => 'nullable|string|in:active,notice_period,resigned,terminated',
            'department_id' => 'nullable|exists:hrms_departments,id',
            'designation' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'date_of_birth' => 'nullable|date',
            'date_of_joining' => 'nullable|date',
            'profile_image' => 'nullable|string|max:500',
            'gender' => 'nullable|string|max:20',
            'blood_group' => 'nullable|string|max:10',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:100',
            'basic_salary' => 'nullable|numeric|min:0',
            'bank_account' => 'nullable|string|max:100',
            'ifsc_code' => 'nullable|string|max:30',
            'pan_number' => 'nullable|string|max:20',
            'aadhaar_number' => 'nullable|string|max:20',
            'pf_number' => 'nullable|string|max:50',
            'esi_number' => 'nullable|string|max:50',
            'role' => 'nullable|string|in:employee,agency_staff,project_manager',
        ]);

        $roleSlug = $validated['role'] ?? Role::SLUG_EMPLOYEE;
        $tid = $me->isSuperAdmin() ? ($request->tenant_id ?? $me->tenant_id) : ($me->tenant_id ?? $me->agency_id);

        // Auto-generate emp_code if not provided
        if (empty($validated['emp_code'])) {
            $lastEmp = User::where('emp_code', 'like', 'EMP%')->orderByDesc('id')->first();
            $nextNum = $lastEmp ? ((int) substr($lastEmp->emp_code, 3)) + 1 : 1001;
            $validated['emp_code'] = 'EMP' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'] ?? Str::random(12)),
            'role' => $roleSlug,
            'tenant_id' => $tid,
            'emp_code' => $validated['emp_code'],
            'employment_status' => $validated['employment_status'] ?? 'active',
            'hrms_department_id' => $validated['department_id'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'date_of_joining' => $validated['date_of_joining'] ?? now()->toDateString(),
            'profile_image' => $validated['profile_image'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'blood_group' => $validated['blood_group'] ?? null,
            'address' => $validated['address'] ?? null,
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'basic_salary' => $validated['basic_salary'] ?? 0,
            'bank_account' => $validated['bank_account'] ?? null,
            'ifsc_code' => $validated['ifsc_code'] ?? null,
            'pan_number' => $validated['pan_number'] ?? null,
            'aadhaar_number' => $validated['aadhaar_number'] ?? null,
            'pf_number' => $validated['pf_number'] ?? null,
            'esi_number' => $validated['esi_number'] ?? null,
        ]);

        // Sync role in role_user pivot
        $role = Role::where('slug', $roleSlug)->first();
        if ($role) {
            $user->roles()->sync([$role->id]);
        }

        $user->load(['hrmsDepartment:id,name,code', 'roles:id,name,slug']);
        return response()->json(['data' => $this->formatEmployee($user)], 201);
    }

    /** PUT /admin/hrms/employees/{id} */
    public function update(Request $request, User $employee): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $employee->id,
            'emp_code' => 'nullable|string|max:50|unique:users,emp_code,' . $employee->id,
            'employment_status' => 'nullable|string|in:active,notice_period,resigned,terminated',
            'department_id' => 'nullable|exists:hrms_departments,id',
            'designation' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'date_of_birth' => 'nullable|date',
            'date_of_joining' => 'nullable|date',
            'profile_image' => 'nullable|string|max:500',
            'gender' => 'nullable|string|max:20',
            'blood_group' => 'nullable|string|max:10',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:100',
            'basic_salary' => 'nullable|numeric|min:0',
            'bank_account' => 'nullable|string|max:100',
            'ifsc_code' => 'nullable|string|max:30',
            'pan_number' => 'nullable|string|max:20',
            'aadhaar_number' => 'nullable|string|max:20',
            'pf_number' => 'nullable|string|max:50',
            'esi_number' => 'nullable|string|max:50',
            'role' => 'nullable|string|in:employee,agency_staff,project_manager',
        ]);

        // Map frontend field names to DB columns
        $updateData = array_filter([
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'emp_code' => $validated['emp_code'] ?? null,
            'employment_status' => $validated['employment_status'] ?? null,
            'hrms_department_id' => array_key_exists('department_id', $validated) ? $validated['department_id'] : null,
            'designation' => $validated['designation'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'date_of_joining' => $validated['date_of_joining'] ?? null,
            'profile_image' => $validated['profile_image'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'blood_group' => $validated['blood_group'] ?? null,
            'address' => $validated['address'] ?? null,
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'basic_salary' => $validated['basic_salary'] ?? null,
            'bank_account' => $validated['bank_account'] ?? null,
            'ifsc_code' => $validated['ifsc_code'] ?? null,
            'pan_number' => $validated['pan_number'] ?? null,
            'aadhaar_number' => $validated['aadhaar_number'] ?? null,
            'pf_number' => $validated['pf_number'] ?? null,
            'esi_number' => $validated['esi_number'] ?? null,
        ], fn($v) => $v !== null);

        if (!empty($validated['role'])) {
            $updateData['role'] = $validated['role'];
            $role = Role::where('slug', $validated['role'])->first();
            if ($role) {
                $employee->roles()->sync([$role->id]);
            }
        }

        $employee->update($updateData);
        $employee->load(['hrmsDepartment:id,name,code', 'roles:id,name,slug']);
        return response()->json(['data' => $this->formatEmployee($employee)]);
    }

    /** POST /admin/hrms/employees/{id}/increment */
    public function addIncrement(Request $request, User $employee): JsonResponse
    {
        $validated = $request->validate([
            'new_salary' => 'required|numeric|min:0',
            'effective_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $employee->update(['basic_salary' => $validated['new_salary']]);
        $employee->load(['hrmsDepartment:id,name,code', 'roles:id,name,slug']);

        return response()->json([
            'message' => 'Salary updated successfully',
            'data' => $this->formatEmployee($employee),
        ]);
    }

    /** GET /admin/hrms/employees/{id}/salary-history */
    public function salaryHistory(User $employee): JsonResponse
    {
        $payrolls = Payroll::where('user_id', $employee->id)
            ->orderByDesc('period_start')
            ->get();
        return response()->json(['data' => $payrolls]);
    }

    /** DELETE /admin/hrms/employees/{id} */
    public function destroy(User $employee): JsonResponse
    {
        // Soft-delete by setting status to terminated
        $employee->update(['employment_status' => 'terminated']);
        return response()->json(['message' => 'Employee terminated']);
    }
}
