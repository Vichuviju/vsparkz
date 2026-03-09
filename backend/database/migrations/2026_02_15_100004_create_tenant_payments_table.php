<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 5)->default('INR');
            $table->string('status', 30)->default('pending');
            $table->date('payment_date')->nullable();
            $table->date('next_due_date')->nullable();
            $table->string('invoice_reference', 100)->nullable();
            $table->string('gateway', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_payments');
    }
};
