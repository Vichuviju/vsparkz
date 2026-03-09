<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ensure freelancers.tenant_id exists (e.g. DB had base freelancers table but
     * evolve_agencies_to_tenants failed or was not run).
     */
    public function up(): void
    {
        if (Schema::hasColumn('freelancers', 'tenant_id')) {
            return;
        }

        Schema::table('freelancers', function (Blueprint $table): void {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
        });

        if (Schema::hasTable('tenants')) {
            Schema::table('freelancers', function (Blueprint $table): void {
                $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('freelancers', 'tenant_id')) {
            return;
        }
        if (Schema::hasTable('tenants')) {
            Schema::table('freelancers', fn (Blueprint $t) => $t->dropForeign(['tenant_id']));
        }
        Schema::table('freelancers', fn (Blueprint $t) => $t->dropColumn('tenant_id'));
    }
};
