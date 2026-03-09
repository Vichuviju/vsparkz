<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
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
        $query = Invoice::query()->with('client:id,company_name')->orderByDesc('created_at');
        $query = $this->scopeByClientAgency($query);
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $invoices = $query->paginate($request->get('per_page', 15));
        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'quotation_id' => 'nullable|exists:quotations,id',
            'number' => 'required|string|max:50|unique:invoices,number',
            'items' => 'nullable|array',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
            'due_date' => 'nullable|date',
        ]);
        $validated['subtotal'] = $validated['subtotal'] ?? 0;
        $validated['tax_rate'] = $validated['tax_rate'] ?? 0;
        $validated['tax_amount'] = $validated['tax_amount'] ?? 0;
        $validated['total'] = $validated['total'] ?? 0;
        $validated['status'] = $validated['status'] ?? 'draft';
        if (! auth()->user()->isSuperAdmin()) {
            Client::forTenant()->findOrFail($validated['client_id']);
        }
        $invoice = Invoice::create($validated);
        $invoice->load('client:id,company_name');
        return response()->json($invoice, 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice = $this->scopeByClientAgency(Invoice::query())->findOrFail($invoice->id);
        $invoice->load(['client', 'quotation', 'payments', 'adjustments']);
        return response()->json($invoice);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'quotation_id' => 'nullable|exists:quotations,id',
            'number' => 'sometimes|string|max:50|unique:invoices,number,' . $invoice->id,
            'items' => 'nullable|array',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
            'due_date' => 'nullable|date',
            'paid_at' => 'nullable|date',
        ]);
        $invoice->update($validated);
        return response()->json($invoice->fresh('client:id,company_name'));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice = $this->scopeByClientAgency(Invoice::query())->findOrFail($invoice->id);
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted']);
    }

    /** Download invoice as PDF. GET /admin/invoices/{id}/pdf */
    public function downloadPdf(Invoice $invoice): Response
    {
        $invoice = $this->scopeByClientAgency(Invoice::query())->findOrFail($invoice->id);
        $invoice->load('client');
        $pdf = app('dompdf.wrapper')->loadView('pdf.invoice', ['invoice' => $invoice]);
        return $pdf->download('invoice-' . $invoice->number . '.pdf');
    }
}
