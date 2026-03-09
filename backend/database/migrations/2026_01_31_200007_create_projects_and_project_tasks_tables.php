<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Projects and project-level tasks (SEO, social, influencer, ads). */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('name');
            $table->string('campaign_type', 50)->nullable();
            $table->string('status', 30)->default('active'); // active, completed, on_hold
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->json('deliverables')->nullable();
            $table->timestamps();
        });

        Schema::create('project_tasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('type', 30); // seo, social, influencer, ads
            $table->string('title');
            $table->string('status', 30)->default('pending');
            $table->date('due_date')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('campaigns', function (Blueprint $table): void {
            $table->foreignId('project_id')->nullable()->after('id')->constrained('projects')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->after('project_id')->constrained('clients')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table): void {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['client_id']);
            $table->dropColumn(['project_id', 'client_id']);
        });
        Schema::dropIfExists('project_tasks');
        Schema::dropIfExists('projects');
    }
};
