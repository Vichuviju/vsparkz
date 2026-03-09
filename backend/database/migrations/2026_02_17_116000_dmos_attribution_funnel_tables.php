<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utm_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('visit_id', 100)->nullable();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->string('utm_source', 255)->nullable();
            $table->string('utm_medium', 255)->nullable();
            $table->string('utm_campaign', 255)->nullable();
            $table->string('utm_term', 255)->nullable();
            $table->string('utm_content', 255)->nullable();
            $table->string('referrer', 1000)->nullable();
            $table->string('landing_url', 1000)->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();
        });

        Schema::create('funnel_stages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            $table->decimal('default_probability', 5, 2)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('funnel_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('funnel_stage_id')->nullable()->constrained('funnel_stages')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->unsignedBigInteger('deal_id')->nullable();
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->json('metadata_json')->nullable();
            $table->timestamps();
        });

        Schema::create('channel_attribution_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->string('channel', 100)->nullable();
            $table->unsignedInteger('leads_count')->default(0);
            $table->unsignedInteger('deals_count')->default(0);
            $table->decimal('revenue_amount', 15, 2)->default(0);
            $table->string('attribution_model', 50)->nullable();
            $table->json('calculation_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channel_attribution_snapshots');
        Schema::dropIfExists('funnel_events');
        Schema::dropIfExists('funnel_stages');
        Schema::dropIfExists('utm_events');
    }
};
