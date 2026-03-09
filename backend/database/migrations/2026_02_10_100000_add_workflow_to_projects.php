<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->string('workflow_status', 50)->default('project_initialized')->after('status')->index();
            $table->foreignId('quotation_id')->nullable()->after('workflow_status')->constrained('quotations')->nullOnDelete();
            $table->foreignId('agreement_id')->nullable()->after('quotation_id')->constrained('agreements')->nullOnDelete();
            $table->foreignId('project_manager_id')->nullable()->after('agreement_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropForeign(['quotation_id']);
            $table->dropForeign(['agreement_id']);
            $table->dropForeign(['project_manager_id']);
            $table->dropColumn(['workflow_status', 'quotation_id', 'agreement_id', 'project_manager_id']);
        });
    }
};
