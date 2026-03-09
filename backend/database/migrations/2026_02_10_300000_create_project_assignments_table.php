<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('assignable_type', 100); // User, Freelancer (morph)
            $table->unsignedBigInteger('assignable_id');
            $table->string('role', 30); // project_manager, freelancer, employee
            $table->text('client_requirement_description')->nullable();
            $table->string('timeline', 255)->nullable();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignId('quotation_service_id')->nullable()->constrained('quotation_services')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_assignments');
    }
};
