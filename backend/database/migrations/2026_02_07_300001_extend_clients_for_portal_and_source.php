<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table): void {
            $table->foreignId('lead_id')->nullable()->after('id')->constrained('leads')->nullOnDelete();
            $table->string('source', 100)->nullable()->after('lead_id');
            $table->foreignId('user_id')->nullable()->after('source')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('lead_id');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn('source');
        });
    }
};
