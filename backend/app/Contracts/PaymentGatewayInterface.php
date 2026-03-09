<?php

namespace App\Contracts;

interface PaymentGatewayInterface
{
    /** Create a payment order/intent and return client secret or order id for frontend. */
    public function createOrder(float $amount, string $currency, array $metadata = []): array;

    /** Verify webhook signature and return payload. */
    public function verifyWebhook(string $payload, string $signature): array;

    /** Get gateway name (razorpay, stripe). */
    public function getName(): string;
}
