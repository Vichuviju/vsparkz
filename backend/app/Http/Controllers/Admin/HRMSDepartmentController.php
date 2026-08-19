<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HrmsDepartment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HRMSDepartmentController extends Controller
{
    /** Scope query to the authenticated user's tenant. */
    private function scopeQuery()
    {
        $query = HrmsDepartment::query()->orderBy('name');
        $me = auth()->user();
        if (!$me->isSuperAdmin()) {
            $tid = $me->tenant_id ?? $me->agency_id;
            if ($tid) {
                $query->where('tenant_id', $tid);
            }
        }
        return $query;
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->scopeQuery()->where('is_active', true);
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        return response()->json(['data' => $query->get()]);
    }

    /**
     * Get departments with employees nested (for HRMS department grid).
     */
    public function withEmployees(): JsonResponse
    {
        $me = auth()->user();
        $query = HrmsDepartment::query()->with(['employees:id,name,email,emp_code,designation,employment_status,profile_image,hrms_department_id'])
            ->where('is_active', true)
            ->orderBy('name');

        if (!$me->isSuperAdmin()) {
            $tid = $me->tenant_id ?? $me->agency_id;
            if ($tid) {
                $query->where('tenant_id', $tid);
            }
        }

        $departments = $query->get()->map(function ($dept) {
            $employees = $dept->employees;
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
                'description' => $dept->description,
                'employees' => $employees->map(fn($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'email' => $e->email,
                    'empCode' => $e->emp_code,
                    'designation' => $e->designation,
                    'status' => $e->employment_status,
                    'profileImage' => $e->profile_image,
                ]),
                'activeEmployeeCount' => $employees->where('employment_status', 'active')->count(),
            ];
        });

        return response()->json(['data' => ['departments' => $departments]]);
    }

    public function show(HrmsDepartment $hrmsDepartment): JsonResponse
    {
        $hrmsDepartment->load('employees:id,name,email,emp_code,designation,employment_status,profile_image');
        return response()->json($hrmsDepartment);
    }

    public function store(Request $request): JsonResponse
    {
        $me = auth()->user();
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:30',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);
        $validated['tenant_id'] = $me->tenant_id ?? $me->agency_id;
        $dept = HrmsDepartment::create($validated);
        return response()->json($dept, 201);
    }

    public function update(Request $request, HrmsDepartment $hrmsDepartment): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'code' => 'nullable|string|max:30',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);
        $hrmsDepartment->update($validated);
        return response()->json($hrmsDepartment);
    }

    public function destroy(HrmsDepartment $hrmsDepartment): JsonResponse
    {
        $hrmsDepartment->delete();
        return response()->json(['message' => 'Department deleted']);
    }
}
