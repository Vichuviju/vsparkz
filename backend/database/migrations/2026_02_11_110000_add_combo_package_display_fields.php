<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('combo_packages', function (Blueprint $table): void {
            $table->string('tagline', 255)->nullable()->after('name');
            $table->text('short_description')->nullable()->after('tagline');
            $table->unsignedSmallInteger('display_order')->default(0)->after('short_description');
            $table->string('pdf_path', 500)->nullable()->after('display_order');
        });
    }

    public function down(): void
    {
        Schema::table('combo_packages', function (Blueprint $table): void {
            $table->dropColumn(['tagline', 'short_description', 'display_order', 'pdf_path']);
        });
    }
};
