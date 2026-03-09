<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'method' => 'nullable|string|max:50',
            'reference' => 'nullable|string|max:100',
            'paid_at' => 'required|date',
        ]);
        $invoice = Invoice::query()->whereHas('client', fn ($q) => $q->forTenant())->find($validated['invoice_id']);
        if (! $invoice) {
            return response()->json(['message' => 'Invoice not found or access denied.'], 404);
        }
        $payment = DB::transaction(function () use ($validated, $invoice) {
            $payment = Payment::create($validated);
            $totalPaid = $invoice->payments()->sum('amount');
            if ($totalPaid >= (float) $invoice->total) {
                $invoice->update(['status' => 'paid', 'paid_at' => $payment->paid_at]);
            }
            return $payment->load('invoice');
        });
        return response()->json($payment, 201);
    }
}
