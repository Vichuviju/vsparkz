<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentGatewayFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentGatewayController extends Controller
{
    public function __construct(
        protected PaymentGatewayFactory $gatewayFactory
    ) {}

    /** Create a payment order for an invoice (Razorpay or Stripe). POST /admin/invoices/{invoice}/create-payment */
    public function createPayment(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'gateway' => 'required|string|in:razorpay,stripe',
        ]);
        $gateway = $this->gatewayFactory->make($validated['gateway']);
        if (! $gateway) {
            return response()->json(['message' => 'Gateway not configured'], 422);
        }
        $amount = (float) $invoice->total;
        $currency = 'INR';
        $result = $gateway->createOrder($amount, $currency, [
            'invoice_id' => (string) $invoice->id,
            'receipt' => $invoice->number,
        ]);
        return response()->json([
            'gateway' => $gateway->getName(),
            'invoice_id' => $invoice->id,
            'amount' => $amount,
            ...$result,
        ]);
    }

    /** Confirm payment (record from frontend after success). POST /admin/payments/confirm */
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'gateway' => 'required|string|in:razorpay,stripe',
            'gateway_payment_id' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
        ]);
        $invoice = Invoice::findOrFail($validated['invoice_id']);
        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => $validated['amount'],
            'method' => 'card',
            'gateway' => $validated['gateway'],
            'gateway_payment_id' => $validated['gateway_payment_id'],
            'gateway_status' => 'captured',
            'paid_at' => now(),
        ]);
        $totalPaid = $invoice->payments()->sum('amount');
        if ($totalPaid >= (float) $invoice->total) {
            $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        }
        return response()->json($payment->load('invoice'), 201);
    }
}
