<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Evolve agencies table to tenants; rename agency_id to tenant_id everywhere. */
    public function up(): void
    {
        // 1) Add new SaaS columns to agencies
        Schema::table('agencies', function (Blueprint $table): void {
            $table->string('company_name')->nullable()->after('name');
            $table->string('email')->nullable()->after('slug');
            $table->string('phone', 50)->nullable()->after('email');
            $table->string('status', 30)->default('active')->after('domain'); // active, suspended, expired
            $table->foreignId('plan_id')->nullable()->after('status')->constrained('subscription_plans')->nullOnDelete();
            $table->unsignedInteger('max_users')->nullable()->after('plan_id');
            $table->unsignedInteger('max_clients')->nullable()->after('max_users');
            $table->unsignedInteger('max_projects')->nullable()->after('max_clients');
            $table->json('feature_flags')->nullable()->after('settings');
            $table->timestamp('trial_ends_at')->nullable()->after('feature_flags');
            $table->timestamp('subscription_ends_at')->nullable()->after('trial_ends_at');
        });

        DB::table('agencies')->update(['company_name' => DB::raw('name')]);

        // 2) Drop foreign keys (keep column for now)
        Schema::table('users', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('leads', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('clients', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('projects', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('freelancers', fn (Blueprint $t) => $t->dropForeign(['agency_id']));

        // 3) Rename table agencies -> tenants
        Schema::rename('agencies', 'tenants');

        // 4) Rename column agency_id -> tenant_id (add new column only if missing, copy, drop old, add FK)
        foreach (['users', 'leads', 'clients', 'projects', 'freelancers'] as $table) {
            if (! Schema::hasColumn($table, 'tenant_id')) {
                Schema::table($table, function (Blueprint $t): void {
                    $t->unsignedBigInteger('tenant_id')->nullable()->after('id');
                });
            }
            if (Schema::hasColumn($table, 'agency_id')) {
                DB::table($table)->whereNotNull('agency_id')->update(['tenant_id' => DB::raw('agency_id')]);
                Schema::table($table, fn (Blueprint $t) => $t->dropColumn('agency_id'));
            }
            try {
                Schema::table($table, function (Blueprint $t): void {
                    $t->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
                });
            } catch (\Throwable $e) {
                // FK may already exist if tenant_id was added by an earlier repair migration that added the constraint
                if (strpos($e->getMessage(), 'duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
                    throw $e;
                }
            }
        }
    }

    public function down(): void
    {
        foreach (['users', 'leads', 'clients', 'projects', 'freelancers'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->dropForeign(['tenant_id']));
            Schema::table($table, function (Blueprint $t): void {
                $t->unsignedBigInteger('agency_id')->nullable()->after('id');
            });
            DB::table($table)->whereNotNull('tenant_id')->update(['agency_id' => DB::raw('tenant_id')]);
            Schema::table($table, fn (Blueprint $t) => $t->dropColumn('tenant_id'));
            Schema::table($table, fn (Blueprint $t) => $t->foreign('agency_id')->references('id')->on('tenants')->nullOnDelete());
        }
        Schema::rename('tenants', 'agencies');
        Schema::table('agencies', function (Blueprint $table): void {
            $table->dropForeign(['plan_id']);
            $table->dropColumn([
                'company_name', 'email', 'phone', 'status', 'plan_id',
                'max_users', 'max_clients', 'max_projects', 'feature_flags',
                'trial_ends_at', 'subscription_ends_at',
            ]);
        });
        Schema::table('users', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('leads', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('clients', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('projects', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
        Schema::table('freelancers', fn (Blueprint $t) => $t->dropForeign(['agency_id']));
    }
};
