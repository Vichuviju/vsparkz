<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\SaaSQuotaExceededException;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectStatusLog;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Project::query()->forTenant()->with(['client:id,company_name', 'service:id,title'])->orderByDesc('created_at');
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('workflow_status')) {
            $query->where('workflow_status', $request->workflow_status);
        }
        $projects = $query->paginate($request->get('per_page', 15));
        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'service_id' => 'nullable|exists:services,id',
            'name' => 'required|string|max:255',
            'campaign_type' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:30',
            'stage' => 'nullable|string|max:50',
            'next_appointment_at' => 'nullable|date',
            'next_appointment_type' => 'nullable|string|max:80',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'deliverables' => 'nullable|array',
        ]);
        $validated['status'] = $validated['status'] ?? 'active';
        $validated['workflow_status'] = Project::WORKFLOW_PROJECT_INITIALIZED;
        if (isset($validated['service_id']) && $validated['service_id'] === '') {
            $validated['service_id'] = null;
        }
        $user = auth()->user();
        if (! $user->isSuperAdmin()) {
            $validated['tenant_id'] = $user->tenant_id ?? $user->agency_id;
            $tenant = Tenant::find($validated['tenant_id']);
            if ($tenant && $tenant->max_projects !== null && $tenant->projects()->count() >= $tenant->max_projects) {
                throw new SaaSQuotaExceededException('Project limit reached for your plan. Please upgrade.');
            }
        }
        $project = Project::create($validated);
        ProjectStatusLog::create([
            'project_id' => $project->id,
            'from_status' => null,
            'to_status' => Project::WORKFLOW_PROJECT_INITIALIZED,
            'user_id' => auth()->id(),
        ]);
        $project->load(['client:id,company_name', 'service:id,title']);
        return response()->json($project, 201);
    }

    public function show(Project $project): JsonResponse
    {
        $project = Project::forAgency()->findOrFail($project->id);
        $project->load([
            'client',
            'service:id,title',
            'quotation:id,number,status',
            'agreement:id,title,status',
            'projectTasks' => fn ($q) => $q->with('assignedTo:id,name,email')->orderBy('due_date'),
            'campaigns',
            'meetings',
            'statusLogs.user:id,name',
        ]);
        return response()->json($project);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $project = Project::forAgency()->findOrFail($project->id);
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'service_id' => 'nullable|exists:services,id',
            'name' => 'sometimes|string|max:255',
            'campaign_type' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:30',
            'workflow_status' => 'nullable|string|in:project_initialized,requirement_gathering,quotation_processing,quotation_generated,quotation_rejected,quotation_resubmitted,agreement_generation,agreement_rework,work_in_progress,completed,on_hold,cancelled',
            'stage' => 'nullable|string|max:50',
            'next_appointment_at' => 'nullable|date',
            'next_appointment_type' => 'nullable|string|max:80',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'deliverables' => 'nullable|array',
        ]);
        if (array_key_exists('service_id', $validated) && $validated['service_id'] === '') {
            $validated['service_id'] = null;
        }
        $oldWorkflow = $project->workflow_status;
        $project->update($validated);
        if (isset($validated['workflow_status']) && $validated['workflow_status'] !== $oldWorkflow) {
            ProjectStatusLog::create([
                'project_id' => $project->id,
                'from_status' => $oldWorkflow,
                'to_status' => $validated['workflow_status'],
                'user_id' => auth()->id(),
            ]);
        }
        return response()->json($project->fresh(['client:id,company_name', 'service:id,title']));
    }

    public function destroy(Project $project): JsonResponse
    {
        $project = Project::forAgency()->findOrFail($project->id);
        $project->delete();
        return response()->json(['message' => 'Project deleted']);
    }
}
