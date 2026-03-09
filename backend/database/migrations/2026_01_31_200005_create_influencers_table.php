<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Influencer management: onboarding and campaign assignment. */
    public function up(): void
    {
        Schema::create('influencers', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('platform', 50)->nullable(); // Instagram, YouTube, etc.
            $table->unsignedBigInteger('followers')->nullable();
            $table->decimal('engagement_rate', 8, 2)->nullable();
            $table->string('language', 20)->nullable();
            $table->string('location', 100)->nullable();
            $table->string('category', 100)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->json('meta')->nullable();
            $table->string('source', 100)->nullable(); // onboarding form, manual, etc.
            $table->string('status', 30)->default('new'); // new, shortlisted, assigned, etc.
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('influencers');
    }
};
