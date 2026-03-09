<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automation_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->string('event_key', 100)->nullable();
            $table->text('description')->nullable();
            $table->json('payload_schema_json')->nullable();
            $table->timestamps();
        });

        Schema::create('automation_actions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->string('action_key', 100)->nullable();
            $table->text('description')->nullable();
            $table->json('config_schema_json')->nullable();
            $table->timestamps();
        });

        Schema::create('automation_workflows', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('definition_json')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('automation_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('automation_workflow_id')->constrained('automation_workflows')->cascadeOnDelete();
            $table->string('event_key', 100)->nullable();
            $table->string('status', 30)->default('running');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('log_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_runs');
        Schema::dropIfExists('automation_workflows');
        Schema::dropIfExists('automation_actions');
        Schema::dropIfExists('automation_events');
    }
};
