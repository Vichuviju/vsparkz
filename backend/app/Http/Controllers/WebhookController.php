<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentGatewayFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        protected PaymentGatewayFactory $gatewayFactory
    ) {}

    public function razorpay(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('X-Razorpay-Signature', '');
        $gateway = $this->gatewayFactory->make('razorpay');
        if (! $gateway) {
            return response()->json(['message' => 'Gateway not configured'], 400);
        }
        try {
            $data = $gateway->verifyWebhook($payload, $signature);
        } catch (\Throwable $e) {
            Log::warning('Razorpay webhook verify failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid signature'], 400);
        }
        $event = $data['event'] ?? '';
        if ($event === 'payment.captured') {
            $paymentData = $data['payload']['payment']['entity'] ?? [];
            $notes = $paymentData['notes'] ?? [];
            $invoiceId = $notes['invoice_id'] ?? null;
            if ($invoiceId) {
                $invoice = Invoice::find($invoiceId);
                if ($invoice) {
                    DB::transaction(function () use ($invoice, $paymentData) {
                        Payment::firstOrCreate(
                            ['gateway_payment_id' => $paymentData['id'] ?? ''],
                            [
                                'invoice_id' => $invoice->id,
                                'amount' => ($paymentData['amount'] ?? 0) / 100,
                                'method' => 'card',
                                'gateway' => 'razorpay',
                                'gateway_status' => $paymentData['status'] ?? 'captured',
                                'paid_at' => now(),
                            ]
                        );
                        $totalPaid = $invoice->payments()->sum('amount');
                        if ($totalPaid >= (float) $invoice->total) {
                            $invoice->update(['status' => 'paid', 'paid_at' => now()]);
                        }
                    });
                }
            }
        }
        return response()->json(['status' => 'ok']);
    }

    public function stripe(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature', '');
        $gateway = $this->gatewayFactory->make('stripe');
        if (! $gateway) {
            return response()->json(['message' => 'Gateway not configured'], 400);
        }
        try {
            $data = $gateway->verifyWebhook($payload, $signature);
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook verify failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid signature'], 400);
        }
        $type = $data['type'] ?? '';
        if ($type === 'payment_intent.succeeded') {
            $pi = $data['data']['object'] ?? [];
            $metadata = $pi['metadata'] ?? [];
            $invoiceId = $metadata['invoice_id'] ?? null;
            if ($invoiceId) {
                $invoice = Invoice::find($invoiceId);
                if ($invoice) {
                    DB::transaction(function () use ($invoice, $pi) {
                        Payment::firstOrCreate(
                            ['gateway_payment_id' => $pi['id'] ?? ''],
                            [
                                'invoice_id' => $invoice->id,
                                'amount' => ($pi['amount_received'] ?? $pi['amount'] ?? 0) / 100,
                                'method' => 'card',
                                'gateway' => 'stripe',
                                'gateway_status' => 'succeeded',
                                'paid_at' => now(),
                            ]
                        );
                        $totalPaid = $invoice->payments()->sum('amount');
                        if ($totalPaid >= (float) $invoice->total) {
                            $invoice->update(['status' => 'paid', 'paid_at' => now()]);
                        }
                    });
                }
            }
        }

        // SaaS Subscription Webhooks
        if ($type === 'checkout.session.completed') {
            $session = $data['data']['object'] ?? [];
            $userId = $session['client_reference_id'] ?? null;
            if ($userId) {
                $user = \App\Models\User::find($userId);
                if ($user) {
                    $user->update([
                        'stripe_customer_id' => $session['customer'] ?? $user->stripe_customer_id,
                        'stripe_subscription_id' => $session['subscription'] ?? null,
                        'subscription_status' => 'active',
                        'plan_started_at' => now(),
                    ]);
                }
            }
        }

        if ($type === 'customer.subscription.updated') {
            $sub = $data['data']['object'] ?? [];
            $user = \App\Models\User::where('stripe_subscription_id', $sub['id'] ?? '')->first();
            if ($user) {
                $user->update([
                    'subscription_status' => ($sub['status'] ?? '') === 'active' ? 'active' : 'expired',
                    'plan_expires_at' => isset($sub['current_period_end']) ? \Carbon\Carbon::createFromTimestamp($sub['current_period_end']) : null,
                    'cancel_at_period_end' => $sub['cancel_at_period_end'] ?? false,
                ]);
            }
        }

        if ($type === 'customer.subscription.deleted') {
            $sub = $data['data']['object'] ?? [];
            $user = \App\Models\User::where('stripe_subscription_id', $sub['id'] ?? '')->first();
            if ($user) {
                $user->update([
                    'subscription_status' => 'expired',
                    'plan_expires_at' => now(),
                    'stripe_subscription_id' => null,
                ]);
            }
        }

        if ($type === 'invoice.paid') {
            $inv = $data['data']['object'] ?? [];
            $user = \App\Models\User::where('stripe_customer_id', $inv['customer'] ?? '')->first();
            if ($user) {
                $user->update(['last_invoice_id' => $inv['id'] ?? null]);
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
