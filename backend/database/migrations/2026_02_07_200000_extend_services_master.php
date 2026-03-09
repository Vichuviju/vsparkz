<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Services master: category, type, duration, dependencies. */
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->string('category', 100)->nullable()->after('slug');
            $table->string('service_type', 30)->default('one-time')->after('category'); // one-time, recurring
            $table->unsignedSmallInteger('default_duration_value')->nullable()->after('service_type');
            $table->string('default_duration_unit', 20)->nullable()->after('default_duration_value'); // days, months
            $table->json('dependencies')->nullable()->after('default_duration_unit'); // service IDs
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->dropColumn(['category', 'service_type', 'default_duration_value', 'default_duration_unit', 'dependencies']);
        });
    }
};
