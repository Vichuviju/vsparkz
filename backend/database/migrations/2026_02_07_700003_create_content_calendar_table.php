<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_calendar_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->date('scheduled_date');
            $table->string('content_type', 30)->nullable();
            $table->string('title')->nullable();
            $table->text('raw_content')->nullable();
            $table->string('status', 30)->default('draft');
            $table->foreignId('influencer_id')->nullable()->constrained('influencers')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_calendar_items');
    }
};
