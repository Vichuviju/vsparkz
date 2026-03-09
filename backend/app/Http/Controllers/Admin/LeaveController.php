<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Leave::query()->with(['user:id,name', 'approvedBy:id,name'])->orderByDesc('start_date');
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $leaves = $query->paginate($request->get('per_page', 15));
        return response()->json($leaves);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string|max:30',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|string|max:30',
        ]);
        $validated['status'] = $validated['status'] ?? 'pending';
        $leave = Leave::create($validated);
        $leave->load('user:id,name');
        return response()->json($leave, 201);
    }

    public function update(Request $request, Leave $leave): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,approved,rejected',
            'approved_by' => 'nullable|exists:users,id',
        ]);
        if (in_array($validated['status'], ['approved', 'rejected'])) {
            $validated['approved_by'] = $validated['approved_by'] ?? $request->user()?->id;
        }
        $leave->update($validated);
        return response()->json($leave->fresh(['user:id,name', 'approvedBy:id,name']));
    }

    public function destroy(Leave $leave): JsonResponse
    {
        $leave->delete();
        return response()->json(['message' => 'Leave deleted']);
    }
}
