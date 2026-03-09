<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Agreement;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ProjectMeeting;
use App\Models\ProjectStatusLog;
use App\Models\Quotation;
use App\Models\QuotationService;
use App\Models\Report;
use App\Services\QuotationPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ClientPortalController extends Controller
{
    private function getClient(Request $request): ?Client
    {
        $user = $request->user();
        if (! $user || $user->effective_role !== 'client') {
            return null;
        }
        if ($user->client_id) {
            return Client::find($user->client_id);
        }
        return Client::where('email', $user->email)->first();
    }

    public function invoices(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $invoices = Invoice::where('client_id', $client->id)->orderByDesc('created_at')->get();
        return response()->json($invoices);
    }

    public function reports(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $reports = Report::where('reference_id', $client->id)->orderByDesc('created_at')->get();
        return response()->json($reports);
    }

    public function agreements(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $agreements = Agreement::where('client_id', $client->id)->with(['project:id,name', 'quotation:id,number'])->orderByDesc('created_at')->get();
        return response()->json($agreements);
    }

    public function showAgreement(Request $request, Agreement $agreement): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client || $agreement->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $agreement->load(['project:id,name', 'quotation:id,number']);
        return response()->json($agreement);
    }

    /** PATCH /client/agreements/{agreement} - action: approve | reject | request_rework */
    public function updateAgreement(Request $request, Agreement $agreement): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client || $agreement->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $validated = $request->validate([
            'action' => 'required|string|in:approve,reject,request_rework',
            'rework_comments' => 'nullable|string|max:2000',
        ]);
        $action = $validated['action'];

        if ($action === 'approve') {
            if ($agreement->status === 'signed') {
                return response()->json($agreement->fresh(), 422);
            }
            $agreement->update(['status' => 'signed', 'signed_at' => now()]);
            if ($agreement->project_id) {
                $project = Project::find($agreement->project_id);
                if ($project) {
                    $old = $project->workflow_status;
                    $project->update(['workflow_status' => Project::WORKFLOW_WORK_IN_PROGRESS]);
                    ProjectStatusLog::create([
                        'project_id' => $project->id,
                        'from_status' => $old,
                        'to_status' => Project::WORKFLOW_WORK_IN_PROGRESS,
                        'user_id' => $request->user()?->id,
                    ]);
                }
            }
            return response()->json($agreement->fresh(['project', 'quotation']));
        }

        if (in_array($action, ['reject', 'request_rework'], true)) {
            $comments = $validated['rework_comments'] ?? '';
            $agreement->update(['rework_comments' => $comments]);
            if ($agreement->project_id) {
                $project = Project::find($agreement->project_id);
                if ($project) {
                    $old = $project->workflow_status;
                    $project->update(['workflow_status' => Project::WORKFLOW_AGREEMENT_REWORK]);
                    ProjectStatusLog::create([
                        'project_id' => $project->id,
                        'from_status' => $old,
                        'to_status' => Project::WORKFLOW_AGREEMENT_REWORK,
                        'user_id' => $request->user()?->id,
                        'notes' => $comments,
                    ]);
                }
            }
            return response()->json($agreement->fresh(['project', 'quotation']));
        }

        return response()->json($agreement);
    }

    public function agreementPdf(Request $request, Agreement $agreement): Response
    {
        $client = $this->getClient($request);
        if (! $client || $agreement->client_id !== $client->id) {
            abort(403);
        }
        $agreement->load(['client', 'project', 'quotation.quotationServices.subService', 'quotation.quotationServices.freelancer:id,name']);

        if ($agreement->file_path && Storage::disk('local')->exists($agreement->file_path)) {
            return response()->file(Storage::disk('local')->path($agreement->file_path), [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="agreement-' . \Illuminate\Support\Str::slug($agreement->title) . '.pdf"',
            ]);
        }
        $pdf = app('dompdf.wrapper')->loadView('pdf.agreement', ['agreement' => $agreement]);
        return $pdf->download('agreement-' . \Illuminate\Support\Str::slug($agreement->title) . '.pdf');
    }

    public function approveAgreement(Request $request, Agreement $agreement): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client || $agreement->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($agreement->status === 'signed') {
            return response()->json($agreement->fresh(), 422);
        }
        $agreement->update(['status' => 'signed', 'signed_at' => now()]);
        if ($agreement->project_id) {
            $project = Project::find($agreement->project_id);
            if ($project) {
                $old = $project->workflow_status;
                $project->update(['workflow_status' => Project::WORKFLOW_WORK_IN_PROGRESS]);
                ProjectStatusLog::create([
                    'project_id' => $project->id,
                    'from_status' => $old,
                    'to_status' => Project::WORKFLOW_WORK_IN_PROGRESS,
                    'user_id' => $request->user()?->id,
                ]);
            }
        }
        return response()->json($agreement->fresh());
    }

    public function projects(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $projects = Project::where('client_id', $client->id)
            ->with(['quotation:id,number,status', 'agreement:id,title,status', 'meetings'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json($projects);
    }

    public function showProject(Request $request, Project $project): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client || $project->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $project->load(['quotation:id,number,status', 'agreement:id,title,status', 'meetings', 'statusLogs']);
        return response()->json($project);
    }

    public function updateProject(Request $request, Project $project): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client || $project->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $validated = $request->validate([
            'action' => 'required|string|in:approve,reject',
            'meeting_scheduled_at' => 'nullable|date',
            'meeting_notes' => 'nullable|string|max:1000',
            'reject_reason' => 'nullable|string|max:500',
        ]);
        $action = $validated['action'];
        $oldWorkflow = $project->workflow_status;

        if ($action === 'approve') {
            if ($oldWorkflow !== Project::WORKFLOW_PROJECT_INITIALIZED) {
                return response()->json(['message' => 'Project cannot be approved in current status'], 422);
            }
            $project->update(['workflow_status' => Project::WORKFLOW_REQUIREMENT_GATHERING]);
            ProjectStatusLog::create([
                'project_id' => $project->id,
                'from_status' => $oldWorkflow,
                'to_status' => Project::WORKFLOW_REQUIREMENT_GATHERING,
                'user_id' => $request->user()?->id,
            ]);
            if (! empty($validated['meeting_scheduled_at'])) {
                ProjectMeeting::create([
                    'project_id' => $project->id,
                    'meeting_type' => 'requirement_meeting',
                    'scheduled_at' => $validated['meeting_scheduled_at'],
                    'notes' => $validated['meeting_notes'] ?? null,
                ]);
            }
        } else {
            if ($oldWorkflow !== Project::WORKFLOW_PROJECT_INITIALIZED) {
                return response()->json(['message' => 'Project cannot be rejected in current status'], 422);
            }
            $project->update(['workflow_status' => Project::WORKFLOW_CANCELLED]);
            ProjectStatusLog::create([
                'project_id' => $project->id,
                'from_status' => $oldWorkflow,
                'to_status' => Project::WORKFLOW_CANCELLED,
                'user_id' => $request->user()?->id,
                'notes' => $validated['reject_reason'] ?? null,
            ]);
        }

        return response()->json($project->fresh(['quotation:id,number,status', 'agreement:id,title,status', 'meetings']));
    }

    /** GET /client/quotations - list quotations for client's projects */
    public function quotations(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $quotations = Quotation::where('client_id', $client->id)
            ->with(['project:id,name', 'quotationServices.subService', 'quotationServices.freelancer:id,name'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json($quotations);
    }

    /** GET /client/quotations/{quotation} */
    public function showQuotation(Request $request, Quotation $quotation): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client || $quotation->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $quotation->load(['project:id,name', 'quotationServices.subService', 'quotationServices.freelancer:id,name']);
        return response()->json($quotation);
    }

    /** PATCH /client/quotations/{quotation} - action: approve | reject | edit */
    public function updateQuotation(Request $request, Quotation $quotation): JsonResponse
    {
        $client = $this->getClient($request);
        if (! $client || $quotation->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'action' => 'required|string|in:approve,reject,edit',
            'rejection_reason' => 'nullable|string|max:1000',
            'quotation_services' => 'nullable|array',
            'quotation_services.*.sub_service_id' => 'required_with:quotation_services|exists:sub_services,id',
            'quotation_services.*.freelancer_id' => 'nullable|exists:freelancers,id',
            'quotation_services.*.time_period' => 'nullable|string|in:weekly,monthly,yearly',
            'quotation_services.*.quantity' => 'nullable|numeric|min:0',
            'quotation_services.*.service_flow' => 'nullable|string|max:255',
            'time_period' => 'nullable|string|in:weekly,monthly,yearly',
        ]);

        $action = $validated['action'];

        if ($action === 'approve') {
            if (! in_array($quotation->status, [Quotation::STATUS_SENT, 'sent'], true)) {
                return response()->json(['message' => 'Quotation cannot be approved in current status'], 422);
            }
            $quotation->update(['status' => Quotation::STATUS_ACCEPTED]);
            if ($quotation->project_id) {
                $project = Project::find($quotation->project_id);
                if ($project) {
                    $old = $project->workflow_status;
                    $project->update(['workflow_status' => Project::WORKFLOW_AGREEMENT_GENERATION]);
                    ProjectStatusLog::create([
                        'project_id' => $project->id,
                        'from_status' => $old,
                        'to_status' => Project::WORKFLOW_AGREEMENT_GENERATION,
                        'user_id' => $request->user()?->id,
                    ]);
                    $this->createAgreementFromQuotation($quotation, $project);
                }
            }
            return response()->json($quotation->fresh(['project', 'quotationServices.subService', 'quotationServices.freelancer:id,name']));
        }

        if ($action === 'reject') {
            if (! in_array($quotation->status, [Quotation::STATUS_SENT, 'sent'], true)) {
                return response()->json(['message' => 'Quotation cannot be rejected in current status'], 422);
            }
            $reason = $validated['rejection_reason'] ?? '';
            $quotation->update(['status' => Quotation::STATUS_REJECTED, 'rejection_reason' => $reason]);
            if ($quotation->project_id) {
                $project = Project::find($quotation->project_id);
                if ($project) {
                    $old = $project->workflow_status;
                    $project->update(['workflow_status' => Project::WORKFLOW_QUOTATION_REJECTED]);
                    ProjectStatusLog::create([
                        'project_id' => $project->id,
                        'from_status' => $old,
                        'to_status' => Project::WORKFLOW_QUOTATION_REJECTED,
                        'user_id' => $request->user()?->id,
                        'notes' => $reason,
                    ]);
                }
            }
            return response()->json($quotation->fresh(['project', 'quotationServices.subService', 'quotationServices.freelancer:id,name']));
        }

        if ($action === 'edit') {
            if (! in_array($quotation->status, [Quotation::STATUS_DRAFT, Quotation::STATUS_SENT, 'draft', 'sent'], true)) {
                return response()->json(['message' => 'Quotation cannot be edited in current status'], 422);
            }
            $quotationServicesInput = $validated['quotation_services'] ?? null;
            if ($quotationServicesInput !== null) {
                $pricing = app(QuotationPricingService::class);
                $timePeriod = $validated['time_period'] ?? $quotation->time_period ?? Quotation::TIME_PERIOD_MONTHLY;
                $taxRate = (float) $quotation->tax_rate;
                $subtotal = 0.0;
                $rows = [];
                foreach ($quotationServicesInput as $i => $row) {
                    $subServiceId = (int) $row['sub_service_id'];
                    $freelancerId = isset($row['freelancer_id']) ? (int) $row['freelancer_id'] : null;
                    $rowTimePeriod = $row['time_period'] ?? $timePeriod;
                    $quantity = (float) ($row['quantity'] ?? 1);
                    $unitPrice = isset($row['unit_price']) ? (float) $row['unit_price'] : $pricing->getUnitPrice($subServiceId, $freelancerId, $rowTimePeriod);
                    $amount = $unitPrice * $quantity;
                    $subtotal += $amount;
                    $rows[] = [
                        'quotation_id' => $quotation->id,
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
                $quotation->update(['subtotal' => $subtotal, 'tax_amount' => $taxAmount, 'total' => $total]);
                $quotation->quotationServices()->delete();
                foreach ($rows as $r) {
                    QuotationService::create($r);
                }
            }
            if (! empty($validated['time_period'])) {
                $quotation->update(['time_period' => $validated['time_period']]);
            }
            return response()->json($quotation->fresh(['project', 'quotationServices.subService', 'quotationServices.freelancer:id,name']));
        }

        return response()->json($quotation);
    }

    /**
     * Create or update agreement from approved quotation, generate PDF, link to project.
     */
    private function createAgreementFromQuotation(Quotation $quotation, Project $project): void
    {
        $quotation->load(['quotationServices.subService', 'quotationServices.freelancer:id,name']);
        $agreement = Agreement::where('project_id', $project->id)->first();
        if (! $agreement) {
            $agreement = Agreement::create([
                'client_id' => $quotation->client_id,
                'project_id' => $project->id,
                'quotation_id' => $quotation->id,
                'title' => 'Agreement – ' . $quotation->number,
                'scope' => 'As per quotation ' . $quotation->number . ' and attached services.',
                'timeline' => $quotation->time_period ? 'Billing period: ' . $quotation->time_period : null,
                'payment_terms' => 'As per quotation. Total: ' . $quotation->total,
                'status' => 'sent',
            ]);
        } else {
            $agreement->update(['quotation_id' => $quotation->id, 'status' => 'sent']);
        }
        $agreement->load(['client', 'project', 'quotation.quotationServices.subService', 'quotation.quotationServices.freelancer:id,name']);
        $pdf = app('dompdf.wrapper')->loadView('pdf.agreement', ['agreement' => $agreement]);
        $pathPrefix = config('filesystems.agreements_path', 'agreements');
        $filename = 'agreement-' . $agreement->id . '-' . preg_replace('/[^a-zA-Z0-9_-]/', '', $agreement->title) . '.pdf';
        $path = $pathPrefix . '/' . $filename;
        Storage::disk('local')->put($path, $pdf->output());
        $agreement->update(['file_path' => $path]);
        $project->update(['agreement_id' => $agreement->id]);
    }

    /** GET /client/quotations/{quotation}/pdf */
    public function quotationPdf(Request $request, Quotation $quotation): Response
    {
        $client = $this->getClient($request);
        if (! $client || $quotation->client_id !== $client->id) {
            abort(403);
        }
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
