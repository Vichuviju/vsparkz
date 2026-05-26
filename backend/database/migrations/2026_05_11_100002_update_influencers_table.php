<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('influencers', function (Blueprint $table): void {
            $table->unsignedBigInteger('youtube_followers')->nullable()->after('followers');
            $table->unsignedBigInteger('instagram_followers')->nullable()->after('youtube_followers');
            $table->foreignId('content_category_id')->nullable()->after('category')->constrained('influencer_categories')->nullOnDelete();
            $table->date('enrolled_at')->nullable()->after('source');
            $table->string('work_status', 30)->nullable()->after('status'); // ready to work, need to contact
            $table->string('growth_status', 30)->nullable()->after('work_status'); // growing, downgrading
            $table->decimal('male_percentage', 5, 2)->nullable()->after('gender_ratio');
            $table->decimal('female_percentage', 5, 2)->nullable()->after('male_percentage');
            $table->string('peak_time', 50)->nullable()->after('female_percentage');
            $table->foreignId('assigned_team_member_id')->nullable()->after('meta')->constrained('users')->nullOnDelete();
            $table->foreignId('reporting_manager_id')->nullable()->after('assigned_team_member_id')->constrained('users')->nullOnDelete();
            $table->string('profile_image')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('influencers', function (Blueprint $table): void {
            $table->dropForeign(['content_category_id']);
            $table->dropForeign(['assigned_team_member_id']);
            $table->dropForeign(['reporting_manager_id']);
            $table->dropColumn([
                'youtube_followers',
                'instagram_followers',
                'content_category_id',
                'enrolled_at',
                'work_status',
                'growth_status',
                'male_percentage',
                'female_percentage',
                'peak_time',
                'assigned_team_member_id',
                'reporting_manager_id',
                'profile_image',
            ]);
        });
    }
};
