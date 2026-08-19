<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->string('status', 20)->default('present'); // present, absent, half_day, late
            $table->decimal('hours_worked', 5, 2)->default(0);
            $table->boolean('is_manual_entry')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'date']);
        });

        Schema::create('biometric_sync_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('provider', 50); // zkteco, essl
            $table->string('status', 20); // success, failed
            $table->integer('records_synced')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_sync_logs');
        Schema::dropIfExists('attendances');
    }
};
