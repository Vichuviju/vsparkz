<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('campaigns')) {
            Schema::table('campaigns', function (Blueprint $table): void {
                if (!Schema::hasColumn('campaigns', 'project_id')) {
                    $table->foreignId('project_id')->nullable()->after('tenant_id')->constrained('projects')->nullOnDelete();
                }
                if (!Schema::hasColumn('campaigns', 'client_id')) {
                    $table->foreignId('client_id')->nullable()->after('project_id')->constrained('clients')->nullOnDelete();
                }
                if (!Schema::hasColumn('campaigns', 'planned_budget')) {
                    $table->decimal('planned_budget', 15, 2)->nullable()->after('status');
                }
                if (!Schema::hasColumn('campaigns', 'expected_roi')) {
                    $table->decimal('expected_roi', 8, 2)->nullable()->after('planned_budget');
                }
                if (!Schema::hasColumn('campaigns', 'campaign_type')) {
                    $table->string('campaign_type', 50)->nullable()->after('name');
                }
            });
        }

        if (Schema::hasTable('campaign_channels')) {
            Schema::table('campaign_channels', function (Blueprint $table): void {
                if (!Schema::hasColumn('campaign_channels', 'channel_type')) {
                    $table->string('channel_type', 80)->nullable()->after('campaign_id');
                }
                if (!Schema::hasColumn('campaign_channels', 'integration_id')) {
                    $table->foreignId('integration_id')->nullable()->after('channel_type')->constrained('integrations')->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('campaign_budgets')) {
            Schema::table('campaign_budgets', function (Blueprint $table): void {
                if (!Schema::hasColumn('campaign_budgets', 'period')) {
                    $table->string('period', 30)->nullable()->after('currency');
                }
            });
        }

        if (Schema::hasTable('ad_campaign_syncs')) {
            Schema::table('ad_campaign_syncs', function (Blueprint $table): void {
                if (!Schema::hasColumn('ad_campaign_syncs', 'error_message')) {
                    $table->text('error_message')->nullable()->after('status');
                }
                if (!Schema::hasColumn('ad_campaign_syncs', 'sync_window_from')) {
                    $table->date('sync_window_from')->nullable()->after('to_date');
                }
                if (!Schema::hasColumn('ad_campaign_syncs', 'sync_window_to')) {
                    $table->date('sync_window_to')->nullable()->after('sync_window_from');
                }
            });
        }

        if (Schema::hasTable('ad_metrics_daily')) {
            Schema::table('ad_metrics_daily', function (Blueprint $table): void {
                if (!Schema::hasColumn('ad_metrics_daily', 'internal_campaign_id')) {
                    $table->foreignId('internal_campaign_id')->nullable()->after('ad_account_id')->constrained('campaigns')->nullOnDelete();
                }
                if (!Schema::hasColumn('ad_metrics_daily', 'external_adset_id')) {
                    $table->string('external_adset_id', 255)->nullable()->after('campaign_id');
                }
                if (!Schema::hasColumn('ad_metrics_daily', 'external_ad_id')) {
                    $table->string('external_ad_id', 255)->nullable()->after('external_adset_id');
                }
                if (!Schema::hasColumn('ad_metrics_daily', 'revenue')) {
                    $table->decimal('revenue', 15, 2)->nullable()->after('conversions');
                }
                if (!Schema::hasColumn('ad_metrics_daily', 'currency')) {
                    $table->string('currency', 10)->nullable()->after('spend');
                }
                if (!Schema::hasColumn('ad_metrics_daily', 'channel')) {
                    $table->string('channel', 50)->nullable()->after('date');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('ad_metrics_daily')) {
            Schema::table('ad_metrics_daily', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('internal_campaign_id');
                $table->dropColumn(['external_adset_id', 'external_ad_id', 'revenue', 'currency', 'channel']);
            });
        }
        if (Schema::hasTable('ad_campaign_syncs')) {
            Schema::table('ad_campaign_syncs', fn (Blueprint $t) => $t->dropColumn(['error_message', 'sync_window_from', 'sync_window_to']));
        }
        if (Schema::hasTable('campaign_budgets')) {
            Schema::table('campaign_budgets', fn (Blueprint $t) => $t->dropColumn('period'));
        }
        if (Schema::hasTable('campaign_channels')) {
            Schema::table('campaign_channels', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('integration_id');
                $table->dropColumn('channel_type');
            });
        }
        if (Schema::hasTable('campaigns')) {
            Schema::table('campaigns', fn (Blueprint $t) => $t->dropColumn(['planned_budget', 'expected_roi', 'campaign_type']));
            Schema::table('campaigns', function (Blueprint $table): void {
                if (Schema::hasColumn('campaigns', 'project_id')) {
                    $table->dropConstrainedForeignId('project_id');
                }
                if (Schema::hasColumn('campaigns', 'client_id')) {
                    $table->dropConstrainedForeignId('client_id');
                }
            });
        }
    }
};
