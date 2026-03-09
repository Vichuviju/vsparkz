<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('scope', 50)->nullable();
            $table->json('layout_json')->nullable();
            $table->json('config_json')->nullable();
            $table->timestamps();
        });

        Schema::create('report_instances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('report_template_id')->constrained('report_templates')->cascadeOnDelete();
            $table->string('context_type', 50)->nullable();
            $table->unsignedBigInteger('context_id')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('snapshot_json')->nullable();
            $table->boolean('is_scheduled')->default(false);
            $table->timestamps();
        });

        Schema::create('widgets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('report_template_id')->constrained('report_templates')->cascadeOnDelete();
            $table->string('type', 50)->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->json('config_json')->nullable();
            $table->timestamps();
        });

        Schema::create('scheduled_exports', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('report_template_id')->constrained('report_templates')->cascadeOnDelete();
            $table->string('export_type', 30)->nullable();
            $table->string('schedule_cron', 100)->nullable();
            $table->json('recipients_json')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_exports');
        Schema::dropIfExists('widgets');
        Schema::dropIfExists('report_instances');
        Schema::dropIfExists('report_templates');
    }
};
