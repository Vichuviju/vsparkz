<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_forecasts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role', 100)->nullable();
            $table->decimal('hours_available', 10, 2)->default(0);
            $table->decimal('hours_booked', 10, 2)->default(0);
            $table->decimal('hours_forecasted', 10, 2)->default(0);
            $table->decimal('utilization_percentage', 5, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('campaign_capacity_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->date('snapshot_date')->nullable();
            $table->decimal('workload_score', 8, 2)->nullable();
            $table->string('risk_level', 30)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('hiring_requirements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->string('role', 100)->nullable();
            $table->unsignedInteger('required_headcount')->default(0);
            $table->text('justification')->nullable();
            $table->string('status', 30)->default('draft');
            $table->timestamps();
        });

        Schema::create('revenue_capacity_forecasts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->decimal('projected_revenue', 15, 2)->default(0);
            $table->decimal('capacity_revenue_ceiling', 15, 2)->nullable();
            $table->decimal('capacity_gap', 15, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revenue_capacity_forecasts');
        Schema::dropIfExists('hiring_requirements');
        Schema::dropIfExists('campaign_capacity_snapshots');
        Schema::dropIfExists('resource_forecasts');
    }
};
