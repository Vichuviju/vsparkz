<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_prices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('sub_service_id')->nullable()->constrained('sub_services')->nullOnDelete();
            $table->foreignId('pricing_level_id')->constrained('pricing_levels')->cascadeOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->unsignedSmallInteger('duration_value')->nullable();
            $table->string('duration_unit', 20)->nullable(); // days, months
            $table->string('frequency', 30)->default('one-time'); // one-time, weekly, monthly
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_prices');
    }
};
