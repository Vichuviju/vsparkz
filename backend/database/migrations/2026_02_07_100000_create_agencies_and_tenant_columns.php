<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tenant-ready: agencies table and agency_id on key tables. */
    public function up(): void
    {
        Schema::create('agencies', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_url')->nullable();
            $table->string('primary_color', 20)->nullable();
            $table->string('domain', 100)->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('agency_id')->nullable()->after('id')->constrained('agencies')->nullOnDelete();
        });

        Schema::table('leads', function (Blueprint $table): void {
            $table->foreignId('agency_id')->nullable()->after('id')->constrained('agencies')->nullOnDelete();
        });

        Schema::table('clients', function (Blueprint $table): void {
            $table->foreignId('agency_id')->nullable()->after('id')->constrained('agencies')->nullOnDelete();
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->foreignId('agency_id')->nullable()->after('id')->constrained('agencies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', fn (Blueprint $t) => $t->dropConstrainedForeignId('agency_id'));
        Schema::table('clients', fn (Blueprint $t) => $t->dropConstrainedForeignId('agency_id'));
        Schema::table('leads', fn (Blueprint $t) => $t->dropConstrainedForeignId('agency_id'));
        Schema::table('users', fn (Blueprint $t) => $t->dropConstrainedForeignId('agency_id'));
        Schema::dropIfExists('agencies');
    }
};
