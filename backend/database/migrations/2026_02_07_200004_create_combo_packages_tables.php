<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('combo_packages', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('discount_type', 20)->default('percent'); // flat, percent
            $table->decimal('discount_value', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('combo_package_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('combo_package_id')->constrained('combo_packages')->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignId('sub_service_id')->nullable()->constrained('sub_services')->nullOnDelete();
            $table->foreignId('pricing_level_id')->nullable()->constrained('pricing_levels')->nullOnDelete();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combo_package_items');
        Schema::dropIfExists('combo_packages');
    }
};
