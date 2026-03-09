<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('slug', 100);
            $table->string('name', 255);
            $table->string('type', 50)->default('api_key'); // oauth|api_key|manual
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'slug']);
        });

        Schema::create('integration_credentials', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('integration_id')->constrained('integrations')->cascadeOnDelete();
            $table->string('key', 100);
            $table->text('value_encrypted');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['integration_id', 'key']);
        });

        Schema::create('integration_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('integration_id')->constrained('integrations')->cascadeOnDelete();
            $table->string('direction', 20); // inbound|outbound
            $table->string('status', 50);
            $table->string('message', 500)->nullable();
            $table->json('payload_json')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_logs');
        Schema::dropIfExists('integration_credentials');
        Schema::dropIfExists('integrations');
    }
};

