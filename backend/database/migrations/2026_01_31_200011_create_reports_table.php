<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Reports: SEO, influencer, campaign, client; payload and optional PDF path. */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 30); // seo, influencer, campaign, client
            $table->unsignedBigInteger('reference_id')->nullable(); // client_id, campaign_id, etc.
            $table->string('title')->nullable();
            $table->json('payload')->nullable();
            $table->string('file_path')->nullable(); // PDF path
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
