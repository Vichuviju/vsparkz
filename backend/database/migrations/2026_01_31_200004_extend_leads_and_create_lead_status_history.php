<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Extend leads (assigned_to, follow_up_date); lead status audit trail. */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->foreignId('assigned_to')->nullable()->after('source')->constrained('users')->nullOnDelete();
            $table->date('follow_up_date')->nullable()->after('assigned_to');
        });

        Schema::create('lead_status_history', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_status_history');
        Schema::table('leads', function (Blueprint $table): void {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['assigned_to', 'follow_up_date']);
        });
    }
};
