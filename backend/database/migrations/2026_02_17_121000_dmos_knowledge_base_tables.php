<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_spaces', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('visibility', 30)->default('all');
            $table->json('allowed_roles_json')->nullable();
            $table->timestamps();
        });

        Schema::create('knowledge_articles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('knowledge_space_id')->constrained('knowledge_spaces')->cascadeOnDelete();
            $table->string('title', 255);
            $table->string('slug', 255)->nullable();
            $table->text('content_markdown')->nullable();
            $table->string('status', 30)->default('draft');
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });

        Schema::create('knowledge_article_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('knowledge_article_id')->constrained('knowledge_articles')->cascadeOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->text('content_markdown')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at')->nullable();
            $table->string('change_summary', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('training_modules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->json('content_json')->nullable();
            $table->json('target_roles_json')->nullable();
            $table->string('status', 30)->default('draft');
            $table->timestamps();
        });

        Schema::create('training_progress', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('training_module_id')->constrained('training_modules')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 30)->default('not_started');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_progress');
        Schema::dropIfExists('training_modules');
        Schema::dropIfExists('knowledge_article_versions');
        Schema::dropIfExists('knowledge_articles');
        Schema::dropIfExists('knowledge_spaces');
    }
};
