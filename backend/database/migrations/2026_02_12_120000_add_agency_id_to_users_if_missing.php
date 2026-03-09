<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Repair: ensure users.agency_id exists (e.g. if create_agencies_and_tenant_columns was skipped or failed). */
    public function up(): void
    {
        if (! Schema::hasTable('agencies')) {
            return;
        }

        if (Schema::hasColumn('users', 'agency_id')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('agency_id')->nullable()->after('id')->constrained('agencies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'agency_id')) {
            return;
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropConstrainedForeignId('agency_id'));
    }
};
