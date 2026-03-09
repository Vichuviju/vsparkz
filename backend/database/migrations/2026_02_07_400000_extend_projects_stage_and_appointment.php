<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->string('stage', 50)->nullable()->after('status');
            $table->timestamp('next_appointment_at')->nullable()->after('stage');
            $table->string('next_appointment_type', 80)->nullable()->after('next_appointment_at');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn(['stage', 'next_appointment_at', 'next_appointment_type']);
        });
    }
};
