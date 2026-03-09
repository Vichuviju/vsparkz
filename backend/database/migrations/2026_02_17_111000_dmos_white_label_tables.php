<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_branding', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained('tenants')->cascadeOnDelete();
            $table->string('primary_color', 30)->nullable();
            $table->string('secondary_color', 30)->nullable();
            $table->string('logo_path', 500)->nullable();
            $table->string('favicon_path', 500)->nullable();
            $table->string('login_background_path', 500)->nullable();
            $table->string('brand_name', 255)->nullable();
            $table->string('support_email', 255)->nullable();
            $table->string('support_url', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('domains', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('domain', 255);
            $table->boolean('is_primary')->default(false);
            $table->string('ssl_status', 30)->nullable();
            $table->string('verification_token', 100)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('email_identities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->string('email', 255);
            $table->string('provider', 50)->nullable();
            $table->foreignId('integration_id')->nullable()->constrained('integrations')->nullOnDelete();
            $table->boolean('is_default')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_identities');
        Schema::dropIfExists('domains');
        Schema::dropIfExists('tenant_branding');
    }
};
