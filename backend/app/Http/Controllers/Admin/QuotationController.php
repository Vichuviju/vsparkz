<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use App\Models\ProjectStatusLog;
use App\Models\Quotation;
use App\Models\QuotationService;
use App\Services\QuotationPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class QuotationController extends Controller
{
    public function __construct(
        private QuotationPricingService $pricing
    ) {}

    private function scopeByClientAgency($query)
    {
        if (auth()->user()->isSuperAdmin()) {
            return $query;
        }
        return $query->whereHas('client', fn ($q) => $q->forTenant());
    }

    /**
     * GET /admin/quotations/build?project_id=1
     * Returns project, client, sub_services (with pricing hint), freelancers (with master_pricing), previous_quotation.
     */
    public function build(Request $request): JsonResponse
    {
        $request->validate(['project_id' => 'required|exists:projects,id']);
        $project = Project::forTenant()->with(['client:id,company_name', 'client_id'])->findOrFail($request->project_id);
        $client = $project->client;
        if (! $client) {
            return response()->json(['message' => 'Project has no client'], 422);
        }

        $subServices = \App\Models\SubService::where('is_active', true)
            ->with(['service:id,title', 'servicePrices'])
            ->orderBy('service_id')
            ->orderBy('sort_order')
            ->get();

        $freelancers = \App\Models\Freelancer::forTenant()
            ->where('is_active', true)
            ->with('masterPricing')
            ->get(['id', 'name', 'email']);

        $previousQuotation = Quotation::where('project_id', $project->id)
            ->with('quotationServices.subService', 'quotationServices.freelancer:id,name')
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'project' => $project,
            'client' => $client,
            'sub_services' => $subServices,
            'freelancers' => $freelancers,
            'previous_quotation' => $previousQuotation,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Quotation::query()->with(['client:id,company_name', 'project:id,name'])->orderByDesc('created_at');
        $query = $this->scopeByClientAgency($query);
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $quotations = $query->paginate($request->get('per_page', 15));
        return response()->json($quotations);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'number' => 'nullable|string|max:50',
            'title' => 'nullable|string|max:255',
            'time_period' => 'nullable|string|in:weekly,monthly,yearly',
            'items' => 'nullable|array',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
            'valid_until' => 'nullable|date',
            'quotation_services' => 'nullable|array',
            'quotation_services.*.sub_service_id' => 'required_with:quotation_services|exists:sub_services,id',
            'quotation_services.*.freelancer_id' => 'nullable|exists:freelancers,id',
            'quotation_services.*.time_period' => 'nullable|string|in:weekly,monthly,yearly',
            'quotation_services.*.quantity' => 'nullable|numeric|min:0',
            'quotation_services.*.service_flow' => 'nullable|string|max:255',
        ]);
        if (! auth()->user()->isSuperAdmin()) {
            Client::forTenant()->findOrFail($validated['client_id']);
        }
        $timePeriod = $validated['time_period'] ?? Quotation::TIME_PERIOD_MONTHLY;
        $taxRate = (float) ($validated['tax_rate'] ?? 0);
        $quotationServicesInput = $validated['quotation_services'] ?? [];

        if (empty($validated['number'])) {
            $validated['number'] = 'Q-' . date('Y') . '-' . str_pad((string) (Quotation::whereYear('created_at', date('Y'))->count() + 1), 4, '0', STR_PAD_LEFT);
            while (Quotation::where('number', $validated['number'])->exists()) {
                $validated['number'] = 'Q-' . date('Y') . '-' . str_pad((string) (Quotation::whereYear('created_at', date('Y'))->count() + 1), 4, '0', STR_PAD_LEFT) . '-' . substr(uniqid(), -5);
            }
        }

        $subtotal = 0.0;
        $rows = [];
        foreach ($quotationServicesInput as $i => $row) {
            $subServiceId = (int) $row['sub_service_id'];
            $freelancerId = isset($row['freelancer_id']) ? (int) $row['freelancer_id'] : null;
            $rowTimePeriod = $row['time_period'] ?? $timePeriod;
            $quantity = (float) ($row['quantity'] ?? 1);
            $unitPrice = isset($row['unit_price']) ? (float) $row['unit_price'] : $this->pricing->getUnitPrice($subServiceId, $freelancerId, $rowTimePeriod);
            $amount = $unitPrice * $quantity;
            $subtotal += $amount;
            $rows[] = [
                'sub_service_id' => $subServiceId,
                'freelancer_id' => $freelancerId,
                'service_flow' => $row['service_flow'] ?? null,
                'time_period' => $rowTimePeriod,
                'unit_price' => $unitPrice,
                'quantity' => $quantity,
                'amount' => $amount,
                'sort_order' => $i,
            ];
        }

        $taxAmount = round($subtotal * $taxRate / 100, 2);
        $total = $subtotal + $taxAmount;

        $quotation = Quotation::create([
            'client_id' => $validated['client_id'],
            'project_id' => $validated['project_id'] ?? null,
            'number' => $validated['number'],
            'title' => $validated['title'] ?? null,
            'time_period' => $timePeriod,
            'items' => $validated['items'] ?? [],
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'status' => $validated['status'] ?? Quotation::STATUS_DRAFT,
            'valid_until' => $validated['valid_until'] ?? null,
        ]);

        foreach ($rows as $r) {
            $r['quotation_id'] = $quotation->id;
            QuotationService::create($r);
        }

        if (! empty($validated['project_id'])) {
            $project = Project::forTenant()->find($validated['project_id']);
            if ($project) {
                $project->update(['quotation_id' => $quotation->id]);
            }
        }

        $quotation->load(['client:id,company_name', 'project:id,name', 'quotationServices.subService', 'quotationServices.freelancer:id,name']);
        return response()->json($quotation, 201);
    }

    public function show(Quotation $quotation): JsonResponse
    {
        $quotation = $this->scopeByClientAgency(Quotation::query())->findOrFail($quotation->id);
        $quotation->load(['client', 'project', 'quotationServices.subService', 'quotationServices.freelancer:id,name']);
        return response()->json($quotation);
    }

    public function update(Request $request, Quotation $quotation): JsonResponse
    {
        $quotation = $this->scopeByClientAgency(Quotation::query())->findOrFail($quotation->id);
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'number' => 'sometimes|string|max:50|unique:quotations,number,' . $quotation->id,
            'title' => 'nullable|string|max:255',
            'time_period' => 'nullable|string|in:weekly,monthly,yearly',
            'items' => 'nullable|array',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
            'valid_until' => 'nullable|date',
            'quotation_services' => 'nullable|array',
            'quotation_services.*.sub_service_id' => 'required_with:quotation_services|exists:sub_services,id',
            'quotation_services.*.freelancer_id' => 'nullable|exists:freelancers,id',
            'quotation_services.*.time_period' => 'nullable|string|in:weekly,monthly,yearly',
            'quotation_services.*.quantity' => 'nullable|numeric|min:0',
            'quotation_services.*.service_flow' => 'nullable|string|max:255',
        ]);

        $timePeriod = $validated['time_period'] ?? $quotation->time_period ?? Quotation::TIME_PERIOD_MONTHLY;
        $taxRate = array_key_exists('tax_rate', $validated) ? (float) $validated['tax_rate'] : (float) $quotation->tax_rate;
        $quotationServicesInput = $validated['quotation_services'] ?? null;

        if ($quotationServicesInput !== null) {
            $subtotal = 0.0;
            $rows = [];
            foreach ($quotationServicesInput as $i => $row) {
                $subServiceId = (int) $row['sub_service_id'];
                $freelancerId = isset($row['freelancer_id']) ? (int) $row['freelancer_id'] : null;
                $rowTimePeriod = $row['time_period'] ?? $timePeriod;
                $quantity = (float) ($row['quantity'] ?? 1);
                $unitPrice = isset($row['unit_price']) ? (float) $row['unit_price'] : $this->pricing->getUnitPrice($subServiceId, $freelancerId, $rowTimePeriod);
                $amount = $unitPrice * $quantity;
                $subtotal += $amount;
                $rows[] = [
                    'sub_service_id' => $subServiceId,
                    'freelancer_id' => $freelancerId,
                    'service_flow' => $row['service_flow'] ?? null,
                    'time_period' => $rowTimePeriod,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'amount' => $amount,
                    'sort_order' => $i,
                ];
            }
            $taxAmount = round($subtotal * $taxRate / 100, 2);
            $total = $subtotal + $taxAmount;
            $quotation->update([
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
            ]);
            $quotation->quotationServices()->delete();
            foreach ($rows as $r) {
                $r['quotation_id'] = $quotation->id;
                QuotationService::create($r);
            }
        }

        $updatePayload = array_intersect_key($validated, array_flip(['client_id', 'project_id', 'number', 'title', 'time_period', 'items', 'status', 'valid_until']));
        $updatePayload = array_filter($updatePayload, fn ($v) => $v !== null);
        if (! empty($updatePayload)) {
            $quotation->update($updatePayload);
        }

        return response()->json($quotation->fresh(['client:id,company_name', 'project:id,name', 'quotationServices.subService', 'quotationServices.freelancer:id,name']));
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        $quotation = $this->scopeByClientAgency(Quotation::query())->findOrFail($quotation->id);
        $quotation->delete();
        return response()->json(['message' => 'Quotation deleted']);
    }

    /**
     * Generate PDF, save to storage, set quotation status to sent and project workflow to quotation_generated.
     * POST /admin/quotations/{quotation}/generate-pdf
     */
    public function generatePdf(Quotation $quotation): JsonResponse
    {
        $quotation = $this->scopeByClientAgency(Quotation::query())->findOrFail($quotation->id);
        $quotation->load(['client', 'quotationServices.subService', 'quotationServices.freelancer:id,name']);
        $pdf = app('dompdf.wrapper')->loadView('pdf.quotation', ['quotation' => $quotation]);
        $pathPrefix = config('filesystems.quotations_path', 'quotations');
        $filename = 'quotation-' . $quotation->id . '-' . preg_replace('/[^a-zA-Z0-9_-]/', '', $quotation->number) . '.pdf';
        $path = $pathPrefix . '/' . $filename;
        Storage::disk('local')->put($path, $pdf->output());
        $quotation->update(['file_path' => $path, 'status' => Quotation::STATUS_SENT]);

        if ($quotation->project_id) {
            $project = Project::forTenant()->find($quotation->project_id);
            if ($project) {
                $old = $project->workflow_status;
                $project->update(['workflow_status' => Project::WORKFLOW_QUOTATION_GENERATED]);
                ProjectStatusLog::create([
                    'project_id' => $project->id,
                    'from_status' => $old,
                    'to_status' => Project::WORKFLOW_QUOTATION_GENERATED,
                    'user_id' => auth()->id(),
                ]);
            }
        }

        return response()->json(['message' => 'PDF generated', 'file_path' => $path]);
    }

    /** Download quotation as PDF. Streams from storage if file_path set, else generates on the fly. */
    public function downloadPdf(Quotation $quotation): Response
    {
        $quotation = $this->scopeByClientAgency(Quotation::query())->findOrFail($quotation->id);
        $quotation->load(['client', 'quotationServices.subService', 'quotationServices.freelancer:id,name']);

        if ($quotation->file_path && Storage::disk('local')->exists($quotation->file_path)) {
            return response()->file(Storage::disk('local')->path($quotation->file_path), [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="quotation-' . $quotation->number . '.pdf"',
            ]);
        }

        $pdf = app('dompdf.wrapper')->loadView('pdf.quotation', ['quotation' => $quotation]);
        return $pdf->download('quotation-' . $quotation->number . '.pdf');
    }
}
