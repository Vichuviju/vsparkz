<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ecommerce_stores', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('platform', 50); // shopify, woocommerce
            $table->string('store_url');
            $table->string('access_token')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('ecommerce_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ecommerce_store_id')->constrained('ecommerce_stores')->cascadeOnDelete();
            $table->string('external_order_id');
            $table->string('customer_name');
            $table->decimal('total_amount', 15, 2);
            $table->string('currency', 10);
            $table->string('status', 30);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ecommerce_orders');
        Schema::dropIfExists('ecommerce_stores');
    }
};
