<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->foreignId('selected_combo_package_id')->nullable()->after('service_id')->constrained('combo_packages')->nullOnDelete();
            $table->json('custom_package_data')->nullable()->after('selected_combo_package_id'); // { "sub_service_ids": [1,2,3], "pricing_type": "freelance" }
            $table->string('pricing_type', 20)->nullable()->after('custom_package_data'); // average, freelance
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->dropForeign(['selected_combo_package_id']);
            $table->dropColumn(['custom_package_data', 'pricing_type']);
        });
    }
};
