<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('content_calendar_items')) {
            Schema::table('content_calendar_items', function (Blueprint $table): void {
                if (!Schema::hasColumn('content_calendar_items', 'tenant_id')) {
                    $table->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->nullOnDelete();
                }
                if (!Schema::hasColumn('content_calendar_items', 'slot')) {
                    $table->string('slot', 30)->nullable()->after('scheduled_date');
                }
            });
        }

        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table): void {
                if (!Schema::hasColumn('posts', 'campaign_id')) {
                    $table->foreignId('campaign_id')->nullable()->after('social_account_id')->constrained('campaigns')->nullOnDelete();
                }
                if (!Schema::hasColumn('posts', 'media_assets')) {
                    $table->json('media_assets')->nullable()->after('content_json');
                }
                if (!Schema::hasColumn('posts', 'error_message')) {
                    $table->text('error_message')->nullable()->after('status');
                }
            });
        }

        if (Schema::hasTable('post_versions')) {
            Schema::table('post_versions', function (Blueprint $table): void {
                if (!Schema::hasColumn('post_versions', 'version')) {
                    $table->unsignedInteger('version')->default(1)->after('post_id');
                }
                if (!Schema::hasColumn('post_versions', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('post_approvals')) {
            Schema::table('post_approvals', function (Blueprint $table): void {
                if (!Schema::hasColumn('post_approvals', 'comment')) {
                    $table->text('comment')->nullable()->after('status');
                }
                if (!Schema::hasColumn('post_approvals', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable()->after('comment');
                }
            });
        }

        if (Schema::hasTable('publish_jobs')) {
            Schema::table('publish_jobs', function (Blueprint $table): void {
                if (!Schema::hasColumn('publish_jobs', 'social_account_id')) {
                    $table->foreignId('social_account_id')->nullable()->after('post_id')->constrained('social_accounts')->nullOnDelete();
                }
                if (!Schema::hasColumn('publish_jobs', 'platform')) {
                    $table->string('platform', 50)->nullable()->after('social_account_id');
                }
                if (!Schema::hasColumn('publish_jobs', 'publish_at')) {
                    $table->timestamp('publish_at')->nullable()->after('platform');
                }
                if (!Schema::hasColumn('publish_jobs', 'job_attempts')) {
                    $table->unsignedSmallInteger('job_attempts')->default(0)->after('status');
                }
                if (!Schema::hasColumn('publish_jobs', 'last_error')) {
                    $table->text('last_error')->nullable()->after('result_payload');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('publish_jobs')) {
            Schema::table('publish_jobs', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('social_account_id');
                $table->dropColumn(['platform', 'publish_at', 'job_attempts', 'last_error']);
            });
        }
        if (Schema::hasTable('post_approvals')) {
            Schema::table('post_approvals', fn (Blueprint $t) => $t->dropColumn(['comment', 'approved_at']));
        }
        if (Schema::hasTable('post_versions')) {
            Schema::table('post_versions', function (Blueprint $table): void {
                $table->dropColumn('version');
                $table->dropConstrainedForeignId('created_by');
            });
        }
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('campaign_id');
                $table->dropColumn(['media_assets', 'error_message']);
            });
        }
        if (Schema::hasTable('content_calendar_items')) {
            Schema::table('content_calendar_items', fn (Blueprint $t) => $t->dropColumn(['tenant_id', 'slot']));
        }
    }
};
