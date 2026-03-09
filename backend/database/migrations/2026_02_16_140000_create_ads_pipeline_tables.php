<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('integration_id')->constrained('integrations')->cascadeOnDelete();
            $table->string('platform', 50); // meta, google, etc.
            $table->string('account_id', 255);
            $table->string('name', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'platform', 'account_id']);
        });

        Schema::create('ad_campaign_syncs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ad_account_id')->constrained('ad_accounts')->cascadeOnDelete();
            $table->timestamp('synced_at')->nullable();
            $table->string('status', 50)->default('pending');
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();
            $table->unsignedInteger('metrics_count')->default(0);
            $table->timestamps();
        });

        Schema::create('ad_metrics_daily', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ad_account_id')->constrained('ad_accounts')->cascadeOnDelete();
            $table->string('campaign_id', 255)->nullable(); // external campaign reference
            $table->string('campaign_name', 255)->nullable();
            $table->date('date');
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->decimal('spend', 15, 2)->default(0);
            $table->unsignedBigInteger('conversions')->nullable();
            $table->json('metadata_json')->nullable();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['ad_account_id', 'campaign_id', 'date'], 'ad_metrics_daily_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_metrics_daily');
        Schema::dropIfExists('ad_campaign_syncs');
        Schema::dropIfExists('ad_accounts');
    }
};

