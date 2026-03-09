<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Freelancer;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\ProjectTask;
use App\Models\TaskUpdate;
use App\Models\TimeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignedProjectsController extends Controller
{
    private function allowedRole(): bool
    {
        $role = auth()->user()?->effective_role ?? auth()->user()?->role ?? '';
        return in_array($role, ['freelancer', 'employee', 'project_manager'], true);
    }

    private function getAssignedProjectIds(): array
    {
        $user = auth()->user();
        if (! $user) {
            return [];
        }
        $ids = [];
        $ids = array_merge($ids, ProjectAssignment::where('assignable_type', 'App\Models\User')->where('assignable_id', $user->id)->pluck('project_id')->toArray());
        $freelancer = Freelancer::where('user_id', $user->id)->first();
        if ($freelancer) {
            $ids = array_merge($ids, ProjectAssignment::where('assignable_type', 'App\Models\Freelancer')->where('assignable_id', $freelancer->id)->pluck('project_id')->toArray());
            $ids = array_merge($ids, ProjectTask::where('freelancer_id', $freelancer->id)->pluck('project_id')->toArray());
        }
        $ids = array_merge($ids, ProjectTask::where('assigned_to', $user->id)->pluck('project_id')->toArray());
        return array_values(array_unique($ids));
    }

    /** GET /portal/assigned-projects */
    public function index(Request $request): JsonResponse
    {
        if (! $this->allowedRole()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $ids = $this->getAssignedProjectIds();
        if (empty($ids)) {
            return response()->json([]);
        }
        $projects = Project::whereIn('id', $ids)
            ->with(['client:id,company_name', 'assignments' => fn ($q) => $q->with('assignable')])
            ->orderByDesc('updated_at')
            ->get();
        return response()->json($projects);
    }

    /** GET /portal/assigned-projects/{project} */
    public function show(Request $request, Project $project): JsonResponse
    {
        if (! $this->allowedRole()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $ids = $this->getAssignedProjectIds();
        if (! in_array($project->id, $ids, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $project->load([
            'client:id,company_name',
            'assignments.assignable',
            'projectTasks' => fn ($q) => $q->with(['assignedTo:id,name', 'freelancer:id,name', 'taskUpdates.user:id,name'])->orderBy('due_date'),
        ]);
        return response()->json($project);
    }

    /** POST /portal/task-updates */
    public function storeTaskUpdate(Request $request): JsonResponse
    {
        if (! $this->allowedRole()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated = $request->validate([
            'project_task_id' => 'required|exists:project_tasks,id',
            'type' => 'required|string|in:work_update,time_log,comment,question',
            'content' => 'nullable|string|max:5000',
            'metadata' => 'nullable|array',
        ]);
        $task = ProjectTask::findOrFail($validated['project_task_id']);
        $ids = $this->getAssignedProjectIds();
        if (! in_array($task->project_id, $ids, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated['user_id'] = auth()->id();
        $update = TaskUpdate::create($validated);
        $update->load('user:id,name');
        return response()->json($update, 201);
    }

    /** PATCH /portal/project-tasks/{task} - status */
    public function updateTask(Request $request, ProjectTask $task): JsonResponse
    {
        if (! $this->allowedRole()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $ids = $this->getAssignedProjectIds();
        if (! in_array($task->project_id, $ids, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated = $request->validate([
            'status' => 'required|string|in:pending,in_progress,review,completed',
        ]);
        $task->update($validated);
        return response()->json($task->fresh(['assignedTo:id,name', 'freelancer:id,name']));
    }

    /** GET /portal/time-logs */
    public function timeLogs(Request $request): JsonResponse
    {
        if (! $this->allowedRole()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $ids = $this->getAssignedProjectIds();
        $query = TimeLog::whereIn('project_id', $ids)->with(['project:id,name', 'task:id,title']);
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        $logs = $query->orderByDesc('started_at')->get();
        return response()->json($logs);
    }

    /** POST /portal/time-logs */
    public function storeTimeLog(Request $request): JsonResponse
    {
        if (! $this->allowedRole()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'nullable|exists:tasks,id',
            'started_at' => 'required|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
            'minutes' => 'nullable|integer|min:0',
            'note' => 'nullable|string|max:1000',
        ]);
        $ids = $this->getAssignedProjectIds();
        if (! in_array((int) $validated['project_id'], $ids, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated['user_id'] = auth()->id();
        if (empty($validated['task_id'])) {
            $validated['task_id'] = null;
        }
        $log = TimeLog::create($validated);
        return response()->json($log->load(['project:id,name', 'task:id,title']), 201);
    }
}
