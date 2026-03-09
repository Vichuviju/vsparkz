<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_questionnaires', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->json('definition_json')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('onboarding_responses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('onboarding_questionnaire_id')->constrained('onboarding_questionnaires')->cascadeOnDelete();
            $table->json('responses_json')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('business_goals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->string('priority', 30)->nullable();
            $table->string('target_metric', 100)->nullable();
            $table->string('target_value', 100)->nullable();
            $table->date('target_date')->nullable();
            $table->timestamps();
        });

        Schema::create('competitor_intakes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('competitor_domain', 255)->nullable();
            $table->text('notes')->nullable();
            $table->string('positioning', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('onboarding_checklists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('workflow_instance_id')->nullable()->constrained('workflow_instances')->nullOnDelete();
            $table->string('status', 30)->default('in_progress');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('onboarding_checklist_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('onboarding_checklist_id')->constrained('onboarding_checklists')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('strategy_approvals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->foreignId('strategy_report_id')->nullable()->constrained('strategy_reports')->nullOnDelete();
            $table->string('status', 30)->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('strategy_approvals');
        Schema::dropIfExists('onboarding_checklist_items');
        Schema::dropIfExists('onboarding_checklists');
        Schema::dropIfExists('competitor_intakes');
        Schema::dropIfExists('business_goals');
        Schema::dropIfExists('onboarding_responses');
        Schema::dropIfExists('onboarding_questionnaires');
    }
};
