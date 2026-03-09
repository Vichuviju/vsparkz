<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Landing page builder: templates, sections, blocks. */
    public function up(): void
    {
        Schema::create('landing_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 50)->unique();
            $table->string('description', 255)->nullable();
            $table->json('layout_style')->nullable(); // section spacing, typography scale
            $table->json('animation_defaults')->nullable();
            $table->boolean('is_active')->default(false); // only one active for public
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('landing_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('landing_template_id')->constrained('landing_templates')->cascadeOnDelete();
            $table->string('type', 50); // hero, logos, services, about, metrics, testimonials, cta, footer_cta
            $table->string('layout_variant', 50)->default('default'); // left-image/right-text, centered, etc.
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('landing_blocks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('landing_section_id')->constrained('landing_sections')->cascadeOnDelete();
            $table->string('type', 50); // headline, subheadline, paragraph, cta, image, video, logo_grid, icon_list, counter
            $table->json('content')->nullable();
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('aspect_ratio', 20)->nullable(); // 16:9, 1:1, 4:5
            $table->string('alignment', 20)->nullable(); // left, center, right
            $table->string('object_fit', 20)->nullable(); // cover, contain
            $table->json('animation_config')->nullable(); // type, delay, duration, trigger
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_blocks');
        Schema::dropIfExists('landing_sections');
        Schema::dropIfExists('landing_templates');
    }
};
