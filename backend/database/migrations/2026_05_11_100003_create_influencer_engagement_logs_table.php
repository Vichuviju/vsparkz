<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('influencer_engagement_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('influencer_id')->constrained('influencers')->cascadeOnDelete();
            $table->decimal('engagement_rate', 8, 2)->nullable();
            $table->unsignedBigInteger('followers')->nullable();
            $table->unsignedBigInteger('instagram_followers')->nullable();
            $table->unsignedBigInteger('youtube_followers')->nullable();
            $table->date('log_date');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('influencer_engagement_logs');
    }
};
