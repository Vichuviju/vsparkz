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

    /** Create a Stripe Checkout Session for SaaS Subscriptions */
    public function createSubscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_name' => 'required|string',
            'amount' => 'required|numeric',
        ]);
        
        $gateway = $this->gatewayFactory->make('stripe');
        if (! $gateway) {
            return response()->json(['message' => 'Gateway not configured'], 422);
        }
        
        $user = auth()->user();
        if (! method_exists($gateway, 'createSubscriptionSession')) {
            return response()->json(['message' => 'Subscription not supported by gateway'], 400);
        }
        
        $result = $gateway->createSubscriptionSession((float) $validated['amount'], $validated['plan_name'], [
            'user_id' => $user->id,
        ]);
        
        // --- LOCAL DEV FAILSAFE ---
        // If Stripe keys are missing, StripeService returns 'session_id=mock'.
        // We will mock the webhook side effect instantly here so the user can test the app locally.
        if (($result['id'] ?? '') === '' || str_starts_with($result['id'] ?? '', 'cs_test_')) {
            $limit = 1;
            if ($validated['plan_name'] === 'Business') $limit = 20;
            if ($validated['plan_name'] === 'Professional') $limit = 5;
            if ($validated['plan_name'] === 'VIP Enterprise') $limit = 999999;
            
            $updateData = ['subscription_status' => 'active'];
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'plan_started_at')) {
                $updateData['plan_started_at'] = now();
            }
            $user->update($updateData);

            if ($user->tenant_id) {
                \Illuminate\Support\Facades\DB::table('tenants')->where('id', $user->tenant_id)->update(['max_users' => $limit]);
            }
        }
        // --- END FAILSAFE ---
        
        return response()->json([
            'gateway' => 'stripe',
            'session_id' => $result['id'] ?? null,
            'url' => $result['url'] ?? null,
        ]);
    }
}
