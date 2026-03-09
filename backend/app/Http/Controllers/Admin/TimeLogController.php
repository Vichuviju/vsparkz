<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TimeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TimeLog::query()->with(['user:id,name', 'task:id,title', 'project:id,name'])->orderByDesc('started_at');
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('started_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('started_at', '<=', $request->to_date);
        }
        $logs = $query->paginate($request->get('per_page', 15));
        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'task_id' => 'nullable|exists:tasks,id',
            'project_id' => 'nullable|exists:projects,id',
            'started_at' => 'required|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
            'minutes' => 'nullable|integer|min:0',
            'note' => 'nullable|string',
        ]);
        $log = TimeLog::create($validated);
        $log->load(['user:id,name', 'task:id,title', 'project:id,name']);
        return response()->json($log, 201);
    }

    public function destroy(TimeLog $timeLog): JsonResponse
    {
        $timeLog->delete();
        return response()->json(['message' => 'Time log deleted']);
    }
}
