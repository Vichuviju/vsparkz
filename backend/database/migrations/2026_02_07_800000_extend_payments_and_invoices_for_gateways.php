<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->string('invoice_type', 30)->default('regular')->after('status'); // advance, milestone, regular
            $table->string('milestone_label', 100)->nullable()->after('invoice_type');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->string('gateway', 30)->nullable()->after('method'); // razorpay, stripe
            $table->string('gateway_payment_id', 255)->nullable()->after('gateway');
            $table->string('gateway_status', 50)->nullable()->after('gateway_payment_id');
        });

        Schema::create('invoice_adjustments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('type', 20); // credit_note, debit_note
            $table->decimal('amount', 12, 2);
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_adjustments');
        Schema::table('payments', function (Blueprint $t): void {
            $t->dropColumn(['gateway', 'gateway_payment_id', 'gateway_status']);
        });
        Schema::table('invoices', function (Blueprint $t): void {
            $t->dropColumn(['invoice_type', 'milestone_label']);
        });
    }
};
