<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_services', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('quotation_id')->constrained('quotations')->cascadeOnDelete();
            $table->foreignId('sub_service_id')->constrained('sub_services')->cascadeOnDelete();
            $table->string('service_flow', 100)->nullable();
            $table->string('time_period', 20)->default('monthly'); // weekly, monthly, yearly
            $table->foreignId('freelancer_id')->nullable()->constrained('freelancers')->nullOnDelete();
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('amount', 12, 2)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_services');
    }
};
