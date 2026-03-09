<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requirement_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('items')->nullable(); // [{ "label": "...", "required": false }]
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('requirement_gatherings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->json('service_ids')->nullable();
            $table->text('expectations')->nullable();
            $table->json('selected_requirements')->nullable(); // template item keys selected
            $table->timestamps();
        });

        Schema::create('requirement_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('requirement_gathering_id')->constrained('requirement_gatherings')->cascadeOnDelete();
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('file_path')->nullable();
            $table->string('original_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requirement_documents');
        Schema::dropIfExists('requirement_gatherings');
        Schema::dropIfExists('requirement_templates');
    }
};
