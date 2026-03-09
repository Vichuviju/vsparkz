<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\ProjectTask;
use App\Models\TimeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkDashboardController extends Controller
{
    /** GET /admin/work-dashboard */
    public function index(Request $request): JsonResponse
    {
        $query = Project::forTenant()->with(['client:id,company_name']);

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('freelancer_id')) {
            $query->whereHas('assignments', fn ($q) => $q->where('assignable_type', 'App\Models\Freelancer')->where('assignable_id', $request->freelancer_id));
        }
        if ($request->filled('project_manager_id')) {
            $query->where(function ($q) use ($request): void {
                $q->where('project_manager_id', $request->project_manager_id)
                    ->orWhereHas('assignments', fn ($a) => $a->where('assignable_type', 'App\Models\User')->where('assignable_id', $request->project_manager_id)->where('role', 'project_manager'));
            });
        }
        if ($request->filled('employee_id')) {
            $userId = $request->employee_id;
            $query->where(function ($q) use ($userId): void {
                $q->whereHas('assignments', fn ($a) => $a->where('assignable_type', 'App\Models\User')->where('assignable_id', $userId))
                    ->orWhereHas('projectTasks', fn ($t) => $t->where('assigned_to', $userId));
            });
        }

        $projects = $query->orderByDesc('updated_at')->get();

        $pending = $projects->filter(fn ($p) => ! in_array($p->workflow_status, ['work_in_progress', 'completed', 'cancelled'], true))->count();
        $inProgress = $projects->filter(fn ($p) => $p->workflow_status === 'work_in_progress')->count();
        $completed = $projects->filter(fn ($p) => $p->workflow_status === 'completed')->count();
        $overdue = $projects->filter(fn ($p) => $p->workflow_status === 'work_in_progress' && $p->next_appointment_at && $p->next_appointment_at->isPast())->count();

        $projectIds = $projects->pluck('id')->toArray();
        $tasksTotal = ProjectTask::whereIn('project_id', $projectIds)->count();
        $tasksCompleted = ProjectTask::whereIn('project_id', $projectIds)->where('status', 'completed')->count();
        $progressPercent = $tasksTotal > 0 ? round($tasksCompleted / $tasksTotal * 100, 1) : 0;

        $timeLogged = TimeLog::whereIn('project_id', $projectIds)->sum('minutes');

        $pendingTasks = ProjectTask::whereIn('project_id', $projectIds)
            ->where('status', '!=', 'completed')
            ->with(['project:id,name', 'assignedTo:id,name'])
            ->orderBy('due_date')
            ->limit(50)
            ->get();

        return response()->json([
            'summary' => [
                'pending' => $pending,
                'in_progress' => $inProgress,
                'completed' => $completed,
                'overdue' => $overdue,
                'progress_percent' => $progressPercent,
                'time_logged_minutes' => (int) $timeLogged,
            ],
            'projects' => $projects,
            'pending_tasks' => $pendingTasks,
        ]);
    }

    /** GET /admin/work-dashboard/reports/work-progress */
    public function workProgressReport(Request $request): JsonResponse
    {
        $query = Project::forTenant();
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        $projectIds = $query->pluck('id')->toArray();
        $tasks = ProjectTask::whereIn('project_id', $projectIds)
            ->select('project_id', 'status', DB::raw('count(*) as count'))
            ->groupBy('project_id', 'status')
            ->get();
        $byProject = $tasks->groupBy('project_id')->map(fn ($rows) => $rows->pluck('count', 'status'));
        return response()->json(['by_project' => $byProject]);
    }

    /** GET /admin/work-dashboard/reports/time-logged */
    public function timeLoggedReport(Request $request): JsonResponse
    {
        $query = Project::forTenant();
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        $projectIds = $query->pluck('id')->toArray();
        $logs = TimeLog::whereIn('project_id', $projectIds)
            ->select('project_id', DB::raw('sum(minutes) as total_minutes'))
            ->groupBy('project_id')
            ->get();
        return response()->json(['by_project' => $logs->keyBy('project_id')]);
    }
}
