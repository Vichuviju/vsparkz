<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_threads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('subject', 500)->nullable();
            $table->string('external_thread_id', 255)->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
        });

        Schema::create('emails', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('email_thread_id')->constrained('email_threads')->cascadeOnDelete();
            $table->string('direction', 20)->nullable();
            $table->string('from_email', 255)->nullable();
            $table->json('to_emails_json')->nullable();
            $table->json('cc_emails_json')->nullable();
            $table->json('bcc_emails_json')->nullable();
            $table->string('subject', 500)->nullable();
            $table->longText('body_html')->nullable();
            $table->text('body_text')->nullable();
            $table->string('provider_message_id', 255)->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->string('status', 30)->nullable();
            $table->timestamps();
        });

        Schema::create('whatsapp_conversations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('whatsapp_number', 50)->nullable();
            $table->string('contact_number', 50)->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->foreignId('integration_id')->nullable()->constrained('integrations')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('whatsapp_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('whatsapp_conversation_id')->constrained('whatsapp_conversations')->cascadeOnDelete();
            $table->string('direction', 20)->nullable();
            $table->string('message_type', 30)->nullable();
            $table->text('body')->nullable();
            $table->json('media_json')->nullable();
            $table->string('provider_message_id', 255)->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->string('status', 30)->nullable();
            $table->timestamps();
        });

        Schema::create('communication_tags', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 100)->nullable();
            $table->string('type', 50)->nullable();
            $table->timestamps();
        });

        Schema::create('communication_taggables', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('communication_tag_id')->constrained('communication_tags')->cascadeOnDelete();
            $table->string('taggable_type', 100)->nullable();
            $table->unsignedBigInteger('taggable_id')->nullable();
            $table->timestamps();
            $table->index(['taggable_type', 'taggable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_taggables');
        Schema::dropIfExists('communication_tags');
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_conversations');
        Schema::dropIfExists('emails');
        Schema::dropIfExists('email_threads');
    }
};
