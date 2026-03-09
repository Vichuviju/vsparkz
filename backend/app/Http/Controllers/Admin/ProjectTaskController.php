<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectTaskController extends Controller
{
    public function index(Project $project): JsonResponse
    {
        $project = Project::forTenant()->findOrFail($project->id);
        $tasks = $project->projectTasks()->with('assignedTo:id,name,email')->orderBy('due_date')->orderBy('id')->get();
        return response()->json($tasks);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $project = Project::forTenant()->findOrFail($project->id);
        $validated = $request->validate([
            'type' => 'required|string|in:seo,social,influencer,ads',
            'title' => 'required|string|max:255',
            'status' => 'nullable|string|max:30',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);
        $validated['project_id'] = $project->id;
        $validated['status'] = $validated['status'] ?? 'pending';
        $task = ProjectTask::create($validated);
        $task->load('assignedTo:id,name,email');
        return response()->json($task, 201);
    }

    public function update(Request $request, ProjectTask $projectTask): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|string|in:seo,social,influencer,ads',
            'title' => 'sometimes|string|max:255',
            'status' => 'nullable|string|max:30',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);
        $projectTask->update($validated);
        return response()->json($projectTask->fresh('assignedTo:id,name,email'));
    }

    public function destroy(ProjectTask $projectTask): JsonResponse
    {
        $projectTask = ProjectTask::whereHas('project', fn ($q) => $q->forTenant())->findOrFail($projectTask->id);
        $projectTask->delete();
        return response()->json(['message' => 'Project task deleted']);
    }
}
