<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;

class StripeService implements PaymentGatewayInterface
{
    public function __construct(
        protected string $secretKey,
        protected string $webhookSecret
    ) {}

    public function getName(): string
    {
        return 'stripe';
    }

    public function createOrder(float $amount, string $currency, array $metadata = []): array
    {
        if (! class_exists(\Stripe\StripeClient::class)) {
            return ['client_secret' => 'demo_secret', 'payment_intent_id' => 'pi_demo', 'amount' => $amount, 'currency' => $currency ?: 'inr'];
        }
        \Stripe\Stripe::setApiKey($this->secretKey);
        $amountCents = (int) round($amount * 100);
        $intent = \Stripe\PaymentIntent::create([
            'amount' => $amountCents,
            'currency' => strtolower($currency ?: 'inr'),
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => $metadata,
        ]);
        return [
            'client_secret' => $intent->client_secret,
            'payment_intent_id' => $intent->id,
            'amount' => $amount,
            'currency' => $intent->currency,
        ];
    }

    public function verifyWebhook(string $payload, string $signature): array
    {
        if (! class_exists(\Stripe\Webhook::class)) {
            return json_decode($payload, true) ?? [];
        }
        try {
            $event = \Stripe\Webhook::constructEvent($payload, $signature, $this->webhookSecret);
            return json_decode(json_encode($event), true);
        } catch (\Throwable $e) {
            throw new \InvalidArgumentException('Invalid webhook signature');
        }
    }
}
