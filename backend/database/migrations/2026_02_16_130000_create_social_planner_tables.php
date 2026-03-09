<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('integration_id')->nullable()->constrained('integrations')->nullOnDelete();
            $table->string('platform', 50);
            $table->string('account_id', 255);
            $table->string('name', 255)->nullable();
            $table->string('credentials_ref', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'platform', 'account_id']);
        });

        Schema::create('posts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('content_calendar_item_id')->nullable()->constrained('content_calendar_items')->nullOnDelete();
            $table->foreignId('social_account_id')->nullable()->constrained('social_accounts')->nullOnDelete();
            $table->json('content_json')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('status', 30)->default('draft'); // draft|scheduled|published|failed
            $table->string('external_id', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('post_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->json('content_json')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('post_approvals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('pending'); // pending|approved|rejected
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('publish_jobs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->uuid('job_uuid')->nullable();
            $table->string('status', 30)->default('pending'); // pending|processing|done|failed
            $table->json('result_payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publish_jobs');
        Schema::dropIfExists('post_approvals');
        Schema::dropIfExists('post_versions');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('social_accounts');
    }
};

