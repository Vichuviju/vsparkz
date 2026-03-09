<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('freelancers', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->json('skills')->nullable();
            $table->json('service_category_ids')->nullable();
            $table->json('pricing')->nullable(); // 3 levels
            $table->json('portfolio_links')->nullable();
            $table->unsignedSmallInteger('delivery_days')->nullable();
            $table->decimal('commission_percent', 5, 2)->nullable();
            $table->string('company_or_individual', 30)->nullable();
            $table->string('availability', 30)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('freelancer_ratings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('freelancer_id')->constrained('freelancers')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
        });

        Schema::create('freelancer_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('freelancer_id')->constrained('freelancers')->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 50)->nullable();
            $table->text('work_details')->nullable();
            $table->string('status', 30)->default('new');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freelancer_requests');
        Schema::dropIfExists('freelancer_ratings');
        Schema::dropIfExists('freelancers');
    }
};
