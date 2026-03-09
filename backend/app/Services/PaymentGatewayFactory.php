<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Facades\Config;

class PaymentGatewayFactory
{
    public function make(string $gateway): ?PaymentGatewayInterface
    {
        if ($gateway === 'razorpay' && Config::get('services.razorpay.key_id')) {
            return new RazorpayService(
                Config::get('services.razorpay.key_id'),
                Config::get('services.razorpay.key_secret'),
                Config::get('services.razorpay.webhook_secret', '')
            );
        }
        if ($gateway === 'stripe' && Config::get('services.stripe.secret')) {
            return new StripeService(
                Config::get('services.stripe.secret'),
                Config::get('services.stripe.webhook_secret', '')
            );
        }
        return null;
    }
}
