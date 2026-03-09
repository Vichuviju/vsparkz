<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agreements', function (Blueprint $table): void {
            $table->foreignId('quotation_id')->nullable()->after('project_id')->constrained('quotations')->nullOnDelete();
            $table->text('rework_comments')->nullable()->after('file_path');
        });
    }

    public function down(): void
    {
        Schema::table('agreements', function (Blueprint $table): void {
            $table->dropForeign(['quotation_id']);
            $table->dropColumn(['quotation_id', 'rework_comments']);
        });
    }
};
