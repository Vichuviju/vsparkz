<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_campaigns', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->text('message');
            $table->timestamp('scheduled_at')->nullable();
            $table->string('status', 20)->default('draft'); // draft, scheduled, sending, sent, failed
            $table->timestamps();
        });

        Schema::create('sms_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sms_campaign_id')->constrained('sms_campaigns')->cascadeOnDelete();
            $table->string('phone_number', 20);
            $table->string('status', 20); // sent, failed
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('sms_campaigns');
    }
};
