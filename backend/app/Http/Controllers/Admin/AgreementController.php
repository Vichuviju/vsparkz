<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agreement;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AgreementController extends Controller
{
    private function scopeByClientAgency($query)
    {
        if (auth()->user()->isSuperAdmin()) {
            return $query;
        }
        return $query->whereHas('client', fn ($q) => $q->forTenant());
    }

    public function index(Request $request): JsonResponse
    {
        $query = Agreement::query()->with(['client:id,company_name', 'project:id,name'])->orderByDesc('created_at');
        $query = $this->scopeByClientAgency($query);
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $items = $query->paginate($request->get('per_page', 15));
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'title' => 'required|string|max:255',
            'scope' => 'nullable|string',
            'timeline' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'status' => 'nullable|string|in:draft,sent,signed',
        ]);
        $validated['status'] = $validated['status'] ?? 'draft';
        if (! auth()->user()->isSuperAdmin()) {
            Client::forTenant()->findOrFail($validated['client_id']);
        }
        $item = Agreement::create($validated);
        return response()->json($item->load(['client', 'project']), 201);
    }

    public function show(Agreement $agreement): JsonResponse
    {
        $agreement = $this->scopeByClientAgency(Agreement::query())->findOrFail($agreement->id);
        $agreement->load(['client', 'project']);
        return response()->json($agreement);
    }

    public function update(Request $request, Agreement $agreement): JsonResponse
    {
        $agreement = $this->scopeByClientAgency(Agreement::query())->findOrFail($agreement->id);
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'title' => 'sometimes|string|max:255',
            'scope' => 'nullable|string',
            'timeline' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'status' => 'nullable|string|in:draft,sent,signed',
        ]);
        $agreement->update($validated);
        return response()->json($agreement->fresh(['client', 'project']));
    }

    public function destroy(Agreement $agreement): JsonResponse
    {
        $agreement = $this->scopeByClientAgency(Agreement::query())->findOrFail($agreement->id);
        $agreement->delete();
        return response()->json(['message' => 'Agreement deleted']);
    }

    /** Download agreement as PDF. GET /admin/agreements/{id}/pdf */
    public function downloadPdf(Agreement $agreement): Response
    {
        $agreement = $this->scopeByClientAgency(Agreement::query())->findOrFail($agreement->id);
        $agreement->load(['client', 'project']);
        $pdf = app('dompdf.wrapper')->loadView('pdf.agreement', ['agreement' => $agreement]);
        return $pdf->download('agreement-' . \Illuminate\Support\Str::slug($agreement->title) . '.pdf');
    }
}
