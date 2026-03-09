<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('slug', 255)->nullable();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('default_currency', 10)->nullable();
            $table->string('time_zone', 50)->nullable();
            $table->unsignedBigInteger('brand_guideline_id')->nullable();
            $table->timestamps();
        });

        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->string('name', 255)->nullable();
            $table->json('address_json')->nullable();
            $table->string('time_zone', 50)->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('brand_assignables', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('brand_id')->constrained('brands')->cascadeOnDelete();
            $table->string('assignable_type', 100)->nullable();
            $table->unsignedBigInteger('assignable_id')->nullable();
            $table->timestamps();
            $table->index(['assignable_type', 'assignable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brand_assignables');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('brands');
    }
};
