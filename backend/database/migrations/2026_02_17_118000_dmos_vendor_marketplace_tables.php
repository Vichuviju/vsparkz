<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('type', 50)->nullable();
            $table->string('contact_email', 255)->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->string('location', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('vendor_rate_cards', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->unsignedBigInteger('sub_service_id')->nullable();
            $table->string('rate_type', 30)->nullable();
            $table->decimal('rate_amount', 15, 2)->nullable();
            $table->string('currency', 10)->nullable();
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();
        });

        Schema::create('vendor_availabilities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->date('date')->nullable();
            $table->decimal('available_hours', 8, 2)->nullable();
            $table->string('status', 30)->nullable();
            $table->timestamps();
        });

        Schema::create('vendor_contracts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->string('contract_number', 100)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('terms_path', 500)->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('vendor_performance_scores', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->json('metrics_json')->nullable();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_performance_scores');
        Schema::dropIfExists('vendor_contracts');
        Schema::dropIfExists('vendor_availabilities');
        Schema::dropIfExists('vendor_rate_cards');
        Schema::dropIfExists('vendors');
    }
};
