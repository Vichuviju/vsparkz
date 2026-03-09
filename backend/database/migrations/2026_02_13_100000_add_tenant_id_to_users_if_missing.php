<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ensure users.tenant_id exists (e.g. DB had only base users table,
     * or evolve_agencies_to_tenants failed before renaming on users).
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'tenant_id')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
        });

        if (Schema::hasTable('tenants')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'tenant_id')) {
            return;
        }
        if (Schema::hasTable('tenants')) {
            Schema::table('users', fn (Blueprint $t) => $t->dropForeign(['tenant_id']));
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('tenant_id'));
    }
};
