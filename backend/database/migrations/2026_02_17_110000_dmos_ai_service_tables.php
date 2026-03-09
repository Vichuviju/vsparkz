<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('use_case', 80)->nullable();
            $table->text('prompt_template')->nullable();
            $table->json('input_schema_json')->nullable();
            $table->json('output_schema_json')->nullable();
            $table->string('default_provider', 50)->nullable();
            $table->string('default_model', 100)->nullable();
            $table->timestamps();
        });

        Schema::create('ai_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('ai_template_id')->nullable()->constrained('ai_templates')->nullOnDelete();
            $table->string('provider', 50)->nullable();
            $table->string('model', 100)->nullable();
            $table->json('input_json')->nullable();
            $table->json('output_json')->nullable();
            $table->string('status', 30)->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('requested_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_usage', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('provider', 50)->nullable();
            $table->string('model', 100)->nullable();
            $table->unsignedInteger('tokens_in')->default(0);
            $table->unsignedInteger('tokens_out')->default(0);
            $table->unsignedBigInteger('cost_minor_units')->default(0);
            $table->string('currency', 10)->nullable();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage');
        Schema::dropIfExists('ai_requests');
        Schema::dropIfExists('ai_templates');
    }
};
