<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('reason')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('admin_comments')->nullable();
            $table->json('attachments')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
        
        Schema::create('vip_request_timelines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vip_request_id')->constrained('vip_requests')->cascadeOnDelete();
            $table->string('status_from')->nullable();
            $table->string('status_to');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_request_timelines');
        Schema::dropIfExists('vip_requests');
    }
};
