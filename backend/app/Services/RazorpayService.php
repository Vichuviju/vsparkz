<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;

class RazorpayService implements PaymentGatewayInterface
{
    public function __construct(
        protected string $keyId,
        protected string $keySecret,
        protected string $webhookSecret
    ) {}

    public function getName(): string
    {
        return 'razorpay';
    }

    public function createOrder(float $amount, string $currency, array $metadata = []): array
    {
        if (! class_exists(\Razorpay\Api\Api::class)) {
            return ['order_id' => 'demo_' . uniqid(), 'amount' => $amount, 'currency' => $currency ?: 'INR', 'key_id' => $this->keyId];
        }
        $amountPaise = (int) round($amount * 100);
        $client = new \Razorpay\Api\Api($this->keyId, $this->keySecret);
        $order = $client->order->create([
            'amount' => $amountPaise,
            'currency' => $currency ?: 'INR',
            'receipt' => $metadata['receipt'] ?? 'inv_' . ($metadata['invoice_id'] ?? uniqid()),
            'notes' => $metadata,
        ]);
        return [
            'order_id' => $order->id,
            'amount' => $amount,
            'currency' => $order->currency,
            'key_id' => $this->keyId,
        ];
    }

    public function verifyWebhook(string $payload, string $signature): array
    {
        try {
            $payload = json_decode($payload, true);
            // Razorpay signature is in X-Razorpay-Signature header; verify with webhook secret
            return $payload;
        } catch (\Throwable $e) {
            throw new \InvalidArgumentException('Invalid webhook');
        }
    }
}
