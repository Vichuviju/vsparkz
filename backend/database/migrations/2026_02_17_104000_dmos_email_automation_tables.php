<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_lists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('source', 30)->default('manual');
            $table->unsignedInteger('size_cache')->default(0);
            $table->boolean('is_dynamic')->default(false);
            $table->timestamps();
        });

        Schema::create('segments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->json('definition_json')->nullable();
            $table->foreignId('contact_list_id')->nullable()->constrained('contact_lists')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('email_automation_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('trigger_type', 50)->nullable();
            $table->json('trigger_config_json')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('email_sequences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('default_sender_identity_id')->nullable();
            $table->foreignId('email_automation_rule_id')->nullable()->constrained('email_automation_rules')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('email_sequence_steps', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('email_sequence_id')->constrained('email_sequences')->cascadeOnDelete();
            $table->unsignedSmallInteger('step_order')->default(0);
            $table->unsignedInteger('delay_minutes')->default(0);
            $table->string('template_id', 100)->nullable();
            $table->string('action_type', 50)->nullable();
            $table->json('action_config_json')->nullable();
            $table->timestamps();
        });

        Schema::create('send_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('email_sequence_id')->nullable()->constrained('email_sequences')->nullOnDelete();
            $table->unsignedBigInteger('email_sequence_step_id')->nullable();
            $table->string('recipient_email', 255);
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->string('provider_message_id', 255)->nullable();
            $table->string('status', 30)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamp('bounced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('engagement_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->foreignId('send_log_id')->nullable()->constrained('send_logs')->nullOnDelete();
            $table->string('event_type', 50)->nullable();
            $table->json('event_payload_json')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('engagement_events');
        Schema::dropIfExists('send_logs');
        Schema::dropIfExists('email_sequence_steps');
        Schema::dropIfExists('email_sequences');
        Schema::dropIfExists('email_automation_rules');
        Schema::dropIfExists('segments');
        Schema::dropIfExists('contact_lists');
    }
};
