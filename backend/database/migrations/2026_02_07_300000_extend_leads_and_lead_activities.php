<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->string('lead_source', 100)->nullable()->after('source');
            $table->boolean('do_not_call')->default(false)->after('lead_source');
            $table->foreignId('converted_to_client_id')->nullable()->after('do_not_call')->constrained('clients')->nullOnDelete();
            $table->string('next_step', 80)->nullable()->after('converted_to_client_id');
            $table->date('next_step_date')->nullable()->after('next_step');
        });

        Schema::create('lead_activities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30); // call, comment, email
            $table->text('content')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_activities');
        Schema::table('leads', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('converted_to_client_id');
            $table->dropColumn(['lead_source', 'do_not_call', 'next_step', 'next_step_date']);
        });
    }
};
