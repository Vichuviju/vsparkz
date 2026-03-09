<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StrategyReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StrategyReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StrategyReport::with(['client:id,company_name', 'project:id,name']);
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $items = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'version' => 'nullable|integer|min:1',
            'status' => 'nullable|string|in:draft,sent,approved',
            'estimated_budget' => 'nullable|numeric|min:0',
            'content' => 'nullable|string',
        ]);
        $v['status'] = $v['status'] ?? 'draft';
        $item = StrategyReport::create($v);
        return response()->json($item->load(['client', 'project']), 201);
    }

    public function show(StrategyReport $strategyReport): JsonResponse
    {
        $strategyReport->load(['client', 'project', 'approvedByUser:id,name']);
        return response()->json($strategyReport);
    }

    public function update(Request $request, StrategyReport $strategyReport): JsonResponse
    {
        $v = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'version' => 'nullable|integer|min:1',
            'status' => 'nullable|string|in:draft,sent,approved',
            'estimated_budget' => 'nullable|numeric|min:0',
            'content' => 'nullable|string',
        ]);
        $strategyReport->update($v);
        return response()->json($strategyReport->fresh(['client', 'project']));
    }

    public function destroy(StrategyReport $strategyReport): JsonResponse
    {
        $strategyReport->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function send(StrategyReport $strategyReport): JsonResponse
    {
        $strategyReport->update(['status' => 'sent']);
        return response()->json($strategyReport->fresh());
    }

    public function approve(Request $request, StrategyReport $strategyReport): JsonResponse
    {
        $strategyReport->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()?->id,
        ]);
        return response()->json($strategyReport->fresh());
    }

    /** Download strategy report as PDF. GET /admin/strategy-reports/{id}/pdf */
    public function downloadPdf(StrategyReport $strategyReport): Response
    {
        $strategyReport->load(['client', 'project']);
        $pdf = app('dompdf.wrapper')->loadView('pdf.strategy_report', ['strategyReport' => $strategyReport]);
        return $pdf->download('strategy-report-' . $strategyReport->id . '.pdf');
    }
}
