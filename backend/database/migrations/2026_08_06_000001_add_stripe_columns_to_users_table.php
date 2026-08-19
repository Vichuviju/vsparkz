<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('stripe_customer_id')->nullable();
            $table->string('stripe_subscription_id')->nullable();
            $table->string('stripe_price_id')->nullable();
            $table->string('stripe_payment_method')->nullable();
            $table->timestamp('plan_started_at')->nullable();
            $table->timestamp('plan_expires_at')->nullable();
            $table->string('billing_cycle', 20)->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->boolean('cancel_at_period_end')->default(false);
            $table->string('last_invoice_id')->nullable();
            $table->timestamp('next_billing_date')->nullable();
            
            // Note: subscription_status is already being used in frontend, making sure it exists
            if (!Schema::hasColumn('users', 'subscription_status')) {
                $table->string('subscription_status', 50)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'stripe_customer_id', 'stripe_subscription_id', 'stripe_price_id',
                'stripe_payment_method', 'plan_started_at', 'plan_expires_at',
                'billing_cycle', 'trial_ends_at', 'subscription_status',
                'cancel_at_period_end', 'last_invoice_id', 'next_billing_date'
            ]);
        });
    }
};
