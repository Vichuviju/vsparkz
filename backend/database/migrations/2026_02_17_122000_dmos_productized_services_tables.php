<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_packages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('slug', 255)->nullable();
            $table->text('description')->nullable();
            $table->decimal('base_price', 15, 2)->nullable();
            $table->string('currency', 10)->nullable();
            $table->string('pricing_model', 30)->default('fixed');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('service_package_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_package_id')->constrained('service_packages')->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignId('sub_service_id')->nullable()->constrained('sub_services')->nullOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('service_package_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_package_id')->constrained('service_packages')->cascadeOnDelete();
            $table->string('rule_type', 50)->nullable();
            $table->json('config_json')->nullable();
            $table->timestamps();
        });

        Schema::create('proposal_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->json('content_json')->nullable();
            $table->foreignId('default_package_id')->nullable()->constrained('service_packages')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_templates');
        Schema::dropIfExists('service_package_rules');
        Schema::dropIfExists('service_package_items');
        Schema::dropIfExists('service_packages');
    }
};
