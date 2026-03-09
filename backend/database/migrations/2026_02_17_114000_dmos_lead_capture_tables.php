<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forms', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('slug', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('embed_script_token', 100)->nullable();
            $table->json('definition_json')->nullable();
            $table->string('destination_type', 50)->nullable();
            $table->json('destination_config_json')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('form_submissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('form_id')->constrained('forms')->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->json('payload_json')->nullable();
            $table->string('source_url', 1000)->nullable();
            $table->json('utm_json')->nullable();
            $table->timestamps();
        });

        Schema::create('form_widgets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('form_id')->nullable()->constrained('forms')->nullOnDelete();
            $table->string('widget_type', 50)->nullable();
            $table->json('config_json')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('tracking_sources', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->string('source_type', 50)->nullable();
            $table->json('config_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_sources');
        Schema::dropIfExists('form_widgets');
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('forms');
    }
};
