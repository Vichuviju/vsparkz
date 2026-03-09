<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table): void {
            $table->foreignId('project_id')->nullable()->after('client_id')->constrained('projects')->nullOnDelete();
            $table->string('time_period', 20)->nullable()->after('title'); // weekly, monthly, yearly
            $table->text('rejection_reason')->nullable()->after('status');
            $table->string('file_path')->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table): void {
            $table->dropForeign(['project_id']);
            $table->dropColumn(['project_id', 'time_period', 'rejection_reason', 'file_path']);
        });
    }
};
