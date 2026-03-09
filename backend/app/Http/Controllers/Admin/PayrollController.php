<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Payroll::query()->with('user:id,name')->orderByDesc('period_end');
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $payrolls = $query->paginate($request->get('per_page', 15));
        return response()->json($payrolls);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'base_amount' => 'nullable|numeric|min:0',
            'adjustments' => 'nullable|array',
            'total' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
        ]);
        $validated['base_amount'] = $validated['base_amount'] ?? 0;
        $validated['total'] = $validated['total'] ?? $validated['base_amount'];
        $validated['status'] = $validated['status'] ?? 'draft';
        $payroll = Payroll::create($validated);
        $payroll->load('user:id,name');
        return response()->json($payroll, 201);
    }

    public function show(Payroll $payroll): JsonResponse
    {
        $payroll->load('user:id,name,email');
        return response()->json($payroll);
    }

    public function update(Request $request, Payroll $payroll): JsonResponse
    {
        $validated = $request->validate([
            'base_amount' => 'nullable|numeric|min:0',
            'adjustments' => 'nullable|array',
            'total' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
            'paid_at' => 'nullable|date',
        ]);
        $payroll->update($validated);
        return response()->json($payroll->fresh('user:id,name'));
    }

    public function destroy(Payroll $payroll): JsonResponse
    {
        $payroll->delete();
        return response()->json(['message' => 'Payroll deleted']);
    }
}
