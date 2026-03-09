<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('billing_cycle', 30)->nullable();
            $table->string('status', 30)->default('active');
            $table->date('next_billing_date')->nullable();
            $table->unsignedBigInteger('last_billed_invoice_id')->nullable();
            $table->timestamps();
        });

        Schema::create('billing_cycles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_subscription_id')->constrained('client_subscriptions')->cascadeOnDelete();
            $table->date('cycle_start')->nullable();
            $table->date('cycle_end')->nullable();
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->decimal('amount', 15, 2)->nullable();
            $table->string('currency', 10)->nullable();
            $table->string('status', 30)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('direction', 20)->nullable();
            $table->decimal('amount', 15, 2)->nullable();
            $table->string('currency', 10)->nullable();
            $table->string('status', 30)->nullable();
            $table->string('gateway', 50)->nullable();
            $table->string('gateway_reference', 255)->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('billing_cycles');
        Schema::dropIfExists('client_subscriptions');
    }
};
