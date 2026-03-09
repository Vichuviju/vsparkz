<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Block-based CMS: Page → Sections → Blocks. */
    public function up(): void
    {
        Schema::create('page_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->string('type', 50); // hero, grid, carousel, cta, stats, testimonial, etc.
            $table->string('layout', 50)->default('default'); // grid, split, full
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('page_blocks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_section_id')->constrained('page_sections')->cascadeOnDelete();
            $table->string('type', 50); // headline, cta, media, etc.
            $table->json('content')->nullable();
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('aspect_ratio', 20)->nullable(); // 16:9, 1:1, 4:5
            $table->json('animation_settings')->nullable();
            $table->json('cta_config')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_blocks');
        Schema::dropIfExists('page_sections');
    }
};
