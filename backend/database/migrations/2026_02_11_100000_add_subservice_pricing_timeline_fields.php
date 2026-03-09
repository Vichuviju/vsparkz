<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_services', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('name');
            $table->decimal('average_price', 12, 2)->nullable()->after('description');
            $table->unsignedSmallInteger('average_duration_value')->nullable()->after('average_price');
            $table->string('average_duration_unit', 20)->nullable()->after('average_duration_value');
            $table->string('service_type', 30)->nullable()->after('average_duration_unit');
        });
    }

    public function down(): void
    {
        Schema::table('sub_services', function (Blueprint $table): void {
            $table->dropColumn([
                'description',
                'average_price',
                'average_duration_value',
                'average_duration_unit',
                'service_type',
            ]);
        });
    }
};
