<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_costs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role', 100)->nullable();
            $table->decimal('hourly_cost', 12, 2)->nullable();
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();
        });

        Schema::create('time_cost_mappings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('time_log_id')->nullable()->constrained('time_logs')->nullOnDelete();
            $table->decimal('cost_amount', 15, 2)->nullable();
            $table->string('currency', 10)->default('INR');
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('profitability_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->decimal('revenue_amount', 15, 2)->default(0);
            $table->decimal('cost_amount', 15, 2)->default(0);
            $table->decimal('margin_amount', 15, 2)->default(0);
            $table->decimal('margin_percentage', 8, 2)->nullable();
            $table->string('calculation_basis', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profitability_snapshots');
        Schema::dropIfExists('time_cost_mappings');
        Schema::dropIfExists('resource_costs');
    }
};
