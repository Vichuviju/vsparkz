<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keywords', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->string('keyword', 500);
            $table->string('target_url', 1000)->nullable();
            $table->string('priority', 30)->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('rankings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('keyword_id')->constrained('keywords')->cascadeOnDelete();
            $table->string('search_engine', 50)->nullable();
            $table->string('device_type', 30)->nullable();
            $table->string('country', 10)->nullable();
            $table->unsignedSmallInteger('position')->nullable();
            $table->string('ranked_url', 1000)->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamps();
        });

        Schema::create('competitors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('domain', 255);
            $table->string('label', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('site_audits', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('url', 1000)->nullable();
            $table->string('audit_type', 50)->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->json('issues_json')->nullable();
            $table->timestamp('run_at')->nullable();
            $table->foreignId('integration_id')->nullable()->constrained('integrations')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('backlinks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('source_url', 1000)->nullable();
            $table->string('target_url', 1000)->nullable();
            $table->string('anchor_text', 500)->nullable();
            $table->string('type', 30)->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backlinks');
        Schema::dropIfExists('site_audits');
        Schema::dropIfExists('competitors');
        Schema::dropIfExists('rankings');
        Schema::dropIfExists('keywords');
    }
};
