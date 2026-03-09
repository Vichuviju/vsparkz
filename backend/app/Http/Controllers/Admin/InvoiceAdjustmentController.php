<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceAdjustment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceAdjustmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = InvoiceAdjustment::with('invoice:id,number,client_id')->orderByDesc('created_at');
        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        $items = $query->paginate($request->get('per_page', 15));
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'type' => 'required|string|in:credit_note,debit_note',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:500',
        ]);
        $item = InvoiceAdjustment::create($validated);
        return response()->json($item->load('invoice'), 201);
    }

    public function show(InvoiceAdjustment $invoiceAdjustment): JsonResponse
    {
        $invoiceAdjustment->load('invoice');
        return response()->json($invoiceAdjustment);
    }

    public function update(Request $request, InvoiceAdjustment $invoiceAdjustment): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|string|in:credit_note,debit_note',
            'amount' => 'sometimes|numeric|min:0.01',
            'reason' => 'nullable|string|max:500',
        ]);
        $invoiceAdjustment->update($validated);
        return response()->json($invoiceAdjustment->fresh('invoice'));
    }

    public function destroy(InvoiceAdjustment $invoiceAdjustment): JsonResponse
    {
        $invoiceAdjustment->delete();
        return response()->json(['message' => 'Adjustment deleted']);
    }
}
