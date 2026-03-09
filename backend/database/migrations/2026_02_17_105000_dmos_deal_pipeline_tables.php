<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deal_stages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('pipeline_name', 100)->nullable();
            $table->string('name', 255);
            $table->unsignedSmallInteger('order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('deals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('name', 255);
            $table->decimal('amount', 15, 2)->nullable();
            $table->string('currency', 10)->default('INR');
            $table->date('expected_close_date')->nullable();
            $table->foreignId('current_stage_id')->nullable()->constrained('deal_stages')->nullOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source', 50)->nullable();
            $table->decimal('probability', 5, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('deal_activities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('activity_type', 50)->nullable();
            $table->string('subject', 500)->nullable();
            $table->text('description')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('forecast_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->date('snapshot_date')->nullable();
            $table->string('pipeline_name', 100)->nullable();
            $table->decimal('total_pipeline_value', 15, 2)->default(0);
            $table->decimal('weighted_pipeline_value', 15, 2)->default(0);
            $table->decimal('expected_revenue_next_30d', 15, 2)->nullable();
            $table->decimal('expected_revenue_next_90d', 15, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forecast_snapshots');
        Schema::dropIfExists('deal_activities');
        Schema::dropIfExists('deals');
        Schema::dropIfExists('deal_stages');
    }
};
