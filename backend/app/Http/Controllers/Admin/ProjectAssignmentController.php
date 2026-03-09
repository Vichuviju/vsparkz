<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Freelancer;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\ProjectTask;
use App\Models\QuotationService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProjectAssignment::query()->with(['project:id,name,client_id', 'assignable', 'service:id,title', 'quotationService.subService']);
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        $assignments = $query->orderBy('project_id')->orderBy('role')->get();
        return response()->json($assignments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'assignable_type' => 'required|string|in:user,freelancer',
            'assignable_id' => 'required|integer|min:1',
            'role' => 'required|string|in:project_manager,freelancer,employee',
            'client_requirement_description' => 'nullable|string|max:5000',
            'timeline' => 'nullable|string|max:255',
            'service_id' => 'nullable|exists:services,id',
            'quotation_service_id' => 'nullable|exists:quotation_services,id',
        ]);

        $project = Project::forTenant()->findOrFail($validated['project_id']);
        $assignableType = $validated['assignable_type'] === 'user'
            ? User::class
            : Freelancer::class;
        $assignable = $assignableType === User::class
            ? User::find($validated['assignable_id'])
            : Freelancer::forTenant()->find($validated['assignable_id']);
        if (! $assignable) {
            return response()->json(['message' => 'Invalid assignable'], 422);
        }

        $assignment = ProjectAssignment::create([
            'project_id' => $validated['project_id'],
            'assignable_type' => $assignableType,
            'assignable_id' => $assignable->id,
            'role' => $validated['role'],
            'client_requirement_description' => $validated['client_requirement_description'] ?? null,
            'timeline' => $validated['timeline'] ?? null,
            'service_id' => $validated['service_id'] ?? null,
            'quotation_service_id' => $validated['quotation_service_id'] ?? null,
        ]);

        $assignment->load(['project', 'assignable', 'service', 'quotationService']);
        return response()->json($assignment, 201);
    }

    /** Bulk store: assignments[] with same structure */
    public function storeBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => 'required|array',
            'assignments.*.project_id' => 'required|exists:projects,id',
            'assignments.*.assignable_type' => 'required|string|in:user,freelancer',
            'assignments.*.assignable_id' => 'required|integer|min:1',
            'assignments.*.role' => 'required|string|in:project_manager,freelancer,employee',
            'assignments.*.client_requirement_description' => 'nullable|string|max:5000',
            'assignments.*.timeline' => 'nullable|string|max:255',
            'assignments.*.service_id' => 'nullable|exists:services,id',
            'assignments.*.quotation_service_id' => 'nullable|exists:quotation_services,id',
        ]);

        $created = [];
        foreach ($validated['assignments'] as $row) {
            $project = Project::forTenant()->find($row['project_id']);
            if (! $project) {
                continue;
            }
            $assignableType = $row['assignable_type'] === 'user' ? User::class : Freelancer::class;
            $assignable = $assignableType === User::class ? User::find($row['assignable_id']) : Freelancer::forTenant()->find($row['assignable_id']);
            if (! $assignable) {
                continue;
            }
            $assignment = ProjectAssignment::create([
                'project_id' => $row['project_id'],
                'assignable_type' => $assignableType,
                'assignable_id' => $assignable->id,
                'role' => $row['role'],
                'client_requirement_description' => $row['client_requirement_description'] ?? null,
                'timeline' => $row['timeline'] ?? null,
                'service_id' => $row['service_id'] ?? null,
                'quotation_service_id' => $row['quotation_service_id'] ?? null,
            ]);
            $assignment->load(['project', 'assignable']);
            $created[] = $assignment;
        }
        return response()->json(['data' => $created], 201);
    }

    public function destroy(ProjectAssignment $projectAssignment): JsonResponse
    {
        $projectAssignment = ProjectAssignment::whereHas('project', fn ($q) => $q->forTenant())->findOrFail($projectAssignment->id);
        $projectAssignment->delete();
        return response()->json(['message' => 'Assignment removed']);
    }
}
