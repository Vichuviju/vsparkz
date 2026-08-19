<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Add HRMS employee profile columns to users table. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('emp_code', 50)->nullable()->unique()->after('role');
            $table->string('employment_status', 30)->default('active')->after('emp_code');
            // active | notice_period | resigned | terminated
            $table->string('department', 100)->nullable()->after('employment_status');
            $table->string('designation', 100)->nullable()->after('department');
            $table->string('phone', 30)->nullable()->after('designation');
            $table->date('date_of_birth')->nullable()->after('phone');
            $table->date('date_of_joining')->nullable()->after('date_of_birth');
            $table->string('profile_image', 500)->nullable()->after('date_of_joining');
            $table->string('gender', 20)->nullable()->after('profile_image');
            $table->string('blood_group', 10)->nullable()->after('gender');
            $table->text('address')->nullable()->after('blood_group');
            $table->string('emergency_contact', 100)->nullable()->after('address');
            $table->decimal('basic_salary', 12, 2)->default(0)->after('emergency_contact');
            $table->string('bank_account', 100)->nullable()->after('basic_salary');
            $table->string('ifsc_code', 30)->nullable()->after('bank_account');
            $table->string('pan_number', 20)->nullable()->after('ifsc_code');
            $table->string('aadhaar_number', 20)->nullable()->after('pan_number');
            $table->string('pf_number', 50)->nullable()->after('aadhaar_number');
            $table->string('esi_number', 50)->nullable()->after('pf_number');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'emp_code', 'employment_status', 'department', 'designation',
                'phone', 'date_of_birth', 'date_of_joining', 'profile_image',
                'gender', 'blood_group', 'address', 'emergency_contact',
                'basic_salary', 'bank_account', 'ifsc_code',
                'pan_number', 'aadhaar_number', 'pf_number', 'esi_number',
            ]);
        });
    }
};
