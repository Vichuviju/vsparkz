<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Task::query()->with(['assignee:id,name', 'project:id,name'])->orderBy('due_date')->orderByDesc('id');
        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', $request->assignee_id);
        }
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $tasks = $query->paginate($request->get('per_page', 15));
        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'status' => 'nullable|string|max:30',
            'project_id' => 'nullable|exists:projects,id',
        ]);
        $validated['status'] = $validated['status'] ?? 'pending';
        $task = Task::create($validated);
        $task->load(['assignee:id,name', 'project:id,name']);
        return response()->json($task, 201);
    }

    public function show(Task $task): JsonResponse
    {
        $task->load(['assignee:id,name,email', 'project:id,name', 'timeLogs']);
        return response()->json($task);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'status' => 'nullable|string|max:30',
            'project_id' => 'nullable|exists:projects,id',
        ]);
        $task->update($validated);
        return response()->json($task->fresh(['assignee:id,name', 'project:id,name']));
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted']);
    }
}
