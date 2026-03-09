<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('influencers', function (Blueprint $table): void {
            $table->string('gender_ratio', 100)->nullable();
            $table->string('location_ratio', 100)->nullable();
            $table->decimal('pricing_per_post', 12, 2)->nullable();
            $table->decimal('pricing_per_reel', 12, 2)->nullable();
            $table->decimal('pricing_per_story', 12, 2)->nullable();
            $table->date('last_analytics_updated')->nullable();
            $table->text('expected_growth_notes')->nullable();
        });

        Schema::table('quotations', function (Blueprint $table): void {
            $table->json('freelancer_costs')->nullable();
            $table->decimal('company_margin', 12, 2)->nullable();
            $table->decimal('gst_rate', 5, 2)->nullable();
            $table->unsignedTinyInteger('revisions_allowed')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $t): void {
            $t->dropColumn(['freelancer_costs', 'company_margin', 'gst_rate', 'revisions_allowed']);
        });
        Schema::table('influencers', function (Blueprint $t): void {
            $t->dropColumn(['gender_ratio', 'location_ratio', 'pricing_per_post', 'pricing_per_reel', 'pricing_per_story', 'last_analytics_updated', 'expected_growth_notes']);
        });
    }
};
