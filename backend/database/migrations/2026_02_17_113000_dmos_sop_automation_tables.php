<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('category', 50)->nullable();
            $table->text('description')->nullable();
            $table->json('definition_json')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('workflow_instances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('workflow_template_id')->constrained('workflow_templates')->cascadeOnDelete();
            $table->string('context_type', 50)->nullable();
            $table->unsignedBigInteger('context_id')->nullable();
            $table->string('status', 30)->default('running');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('task_blueprints', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workflow_template_id')->constrained('workflow_templates')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('role', 100)->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            $table->unsignedInteger('relative_due_days')->nullable();
            $table->timestamps();
        });

        Schema::create('workflow_tasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workflow_instance_id')->constrained('workflow_instances')->cascadeOnDelete();
            $table->foreignId('task_blueprint_id')->nullable()->constrained('task_blueprints')->nullOnDelete();
            $table->string('name', 255)->nullable();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('pending');
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_tasks');
        Schema::dropIfExists('task_blueprints');
        Schema::dropIfExists('workflow_instances');
        Schema::dropIfExists('workflow_templates');
    }
};
