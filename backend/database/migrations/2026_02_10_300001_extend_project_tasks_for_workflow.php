<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_tasks', function (Blueprint $table): void {
            $table->foreignId('sub_service_id')->nullable()->after('project_id')->constrained('sub_services')->nullOnDelete();
            $table->foreignId('freelancer_id')->nullable()->after('assigned_to')->constrained('freelancers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_tasks', function (Blueprint $table): void {
            $table->dropForeign(['sub_service_id']);
            $table->dropForeign(['freelancer_id']);
            $table->dropColumn(['sub_service_id', 'freelancer_id']);
        });
    }
};
