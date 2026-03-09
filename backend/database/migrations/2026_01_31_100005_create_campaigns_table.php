<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Influencer campaign tracking: name, client, reach, engagement, result. */
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('client')->nullable();
            $table->string('influencer_name')->nullable();
            $table->string('platform')->nullable(); // Instagram, YouTube, etc.
            $table->unsignedBigInteger('influencer_reach')->nullable();
            $table->decimal('engagement_rate', 8, 2)->nullable();
            $table->text('result_summary')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 20)->default('active'); // active, completed, paused
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
