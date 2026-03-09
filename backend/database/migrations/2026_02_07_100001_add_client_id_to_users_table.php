<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Link user to client for client portal login. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('client_id')->nullable()->after('agency_id')->constrained('clients')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->dropConstrainedForeignId('client_id'));
    }
};
