<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_services', function (Blueprint $table): void {
            $table->decimal('freelance_price', 12, 2)->nullable()->after('average_price');
        });
    }

    public function down(): void
    {
        Schema::table('sub_services', function (Blueprint $table): void {
            $table->dropColumn('freelance_price');
        });
    }
};
