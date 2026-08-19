<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** HRMS Departments table: standalone department entity linked to tenants. */
    public function up(): void
    {
        Schema::create('hrms_departments', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 30)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add foreign key linking users to departments
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('hrms_department_id')->nullable()
                ->after('department')
                ->constrained('hrms_departments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['hrms_department_id']);
            $table->dropColumn('hrms_department_id');
        });
        Schema::dropIfExists('hrms_departments');
    }
};
