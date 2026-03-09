<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\Influencer;
use App\Models\Lead;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Report::query()->orderByDesc('created_at');
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        $reports = $query->paginate($request->get('per_page', 15));
        return response()->json($reports);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:seo,influencer,campaign,client',
            'reference_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);
        $payload = $this->generatePayload(
            $validated['type'],
            $validated['reference_id'] ?? null,
            $validated['from_date'] ?? null,
            $validated['to_date'] ?? null
        );
        $report = Report::create([
            'type' => $validated['type'],
            'reference_id' => $validated['reference_id'],
            'title' => $validated['title'] ?? ($validated['type'] . ' report ' . now()->format('Y-m-d')),
            'payload' => $payload,
        ]);
        return response()->json($report, 201);
    }

    public function show(Report $report): JsonResponse
    {
        return response()->json($report);
    }

    /** Download report as PDF. GET /admin/reports/{report}/pdf */
    public function downloadPdf(Report $report): Response
    {
        $pdf = app('dompdf.wrapper')->loadView('pdf.report', ['report' => $report]);
        return $pdf->download('report-' . $report->id . '-' . \Illuminate\Support\Str::slug($report->title) . '.pdf');
    }

    public function destroy(Report $report): JsonResponse
    {
        $report->delete();
        return response()->json(null, 204);
    }

    private function generatePayload(string $type, ?int $referenceId, ?string $fromDate, ?string $toDate): array
    {
        $q = fn ($q) => $q;
        if ($fromDate) {
            $q = fn ($q) => $q->whereDate('created_at', '>=', $fromDate);
        }
        if ($toDate) {
            $q = fn ($query) => (clone $q)($query)->whereDate('created_at', '<=', $toDate);
        }
        switch ($type) {
            case 'seo':
                $leads = Lead::when($fromDate, fn ($q) => $q->whereDate('created_at', '>=', $fromDate))->when($toDate, fn ($q) => $q->whereDate('created_at', '<=', $toDate))->select(DB::raw('count(*) as total'), 'source')->groupBy('source')->get();
                return ['leads_by_source' => $leads, 'generated_at' => now()->toIso8601String()];
            case 'influencer':
                $list = Influencer::when($fromDate, fn ($q) => $q->whereDate('created_at', '>=', $fromDate))->when($toDate, fn ($q) => $q->whereDate('created_at', '<=', $toDate))->get(['id', 'name', 'platform', 'followers', 'engagement_rate', 'status']);
                return ['influencers' => $list, 'generated_at' => now()->toIso8601String()];
            case 'campaign':
                $list = Campaign::when($referenceId, fn ($q) => $q->where('client_id', $referenceId)->orWhere('project_id', $referenceId))
                    ->when($fromDate, fn ($q) => $q->whereDate('start_date', '>=', $fromDate))
                    ->when($toDate, fn ($q) => $q->whereDate('end_date', '<=', $toDate))
                    ->with('clientRelation:id,company_name')->get();
                return ['campaigns' => $list, 'generated_at' => now()->toIso8601String()];
            case 'client':
                $client = $referenceId ? Client::with(['projects', 'invoices'])->find($referenceId) : null;
                return ['client' => $client, 'generated_at' => now()->toIso8601String()];
            default:
                return ['generated_at' => now()->toIso8601String()];
        }
    }
}
