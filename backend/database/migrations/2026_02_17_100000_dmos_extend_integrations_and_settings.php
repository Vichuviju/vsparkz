<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('integrations')) {
            Schema::table('integrations', function (Blueprint $table): void {
                if (!Schema::hasColumn('integrations', 'category')) {
                    $table->string('category', 50)->nullable()->after('type');
                }
                if (!Schema::hasColumn('integrations', 'config_schema')) {
                    $table->json('config_schema')->nullable()->after('is_active');
                }
                if (Schema::hasColumn('integrations', 'tenant_id') && !Schema::hasColumn('integrations', 'tenant_id')) {
                    // allow nullable tenant_id for global integrations
                    // no change if already required
                }
            });
        }

        if (Schema::hasTable('integration_credentials')) {
            Schema::table('integration_credentials', function (Blueprint $table): void {
                if (!Schema::hasColumn('integration_credentials', 'account_identifier')) {
                    $table->string('account_identifier', 255)->nullable()->after('integration_id');
                }
            });
        }

        if (Schema::hasTable('integration_logs')) {
            Schema::table('integration_logs', function (Blueprint $table): void {
                if (!Schema::hasColumn('integration_logs', 'correlation_id')) {
                    $table->string('correlation_id', 100)->nullable()->after('integration_id');
                }
                if (!Schema::hasColumn('integration_logs', 'latency_ms')) {
                    $table->unsignedInteger('latency_ms')->nullable()->after('payload_json');
                }
            });
        }

        // system_settings: use key as "group.key" for multiple groups; existing unique (tenant_id, key) kept
    }

    public function down(): void
    {
        if (Schema::hasTable('integration_logs')) {
            Schema::table('integration_logs', fn (Blueprint $t) => $t->dropColumn(['correlation_id', 'latency_ms']));
        }
        if (Schema::hasTable('integration_credentials')) {
            Schema::table('integration_credentials', fn (Blueprint $t) => $t->dropColumn('account_identifier'));
        }
        if (Schema::hasTable('integrations')) {
            Schema::table('integrations', fn (Blueprint $t) => $t->dropColumn(['category', 'config_schema']));
        }
    }
};
