<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('influencers', function (Blueprint $table): void {
            $table->foreignId('assigned_manager')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('freelancers', function (Blueprint $table): void {
            $table->foreignId('assigned_manager')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('freelancers', function (Blueprint $table): void {
            $table->dropForeign(['assigned_manager']);
            $table->dropColumn('assigned_manager');
        });

        Schema::table('influencers', function (Blueprint $table): void {
            $table->dropForeign(['assigned_manager']);
            $table->dropColumn('assigned_manager');
        });
    }
};
