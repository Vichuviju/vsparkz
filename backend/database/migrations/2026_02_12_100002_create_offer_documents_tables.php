<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Package generator: multi-combo layout for PDF and website (like TUSHSPECTRAL pricing). */
    public function up(): void
    {
        Schema::create('offer_documents', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->nullable()->unique();
            $table->string('pricing_title', 100)->default('PRICING');
            $table->text('limited_offer_text')->nullable(); // e.g. "LIMITED OFFER"
            $table->json('sidebar_features')->nullable(); // ["Digital Marketing Packages", "Customizable Packages", ...]
            $table->string('payment_note', 255)->nullable();
            $table->string('logo_path', 500)->nullable();
            $table->string('company_name', 255)->nullable();
            $table->string('tagline', 255)->nullable();
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true); // show to website
            $table->timestamps();
        });

        Schema::create('offer_document_combo_package', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('offer_document_id')->constrained('offer_documents')->cascadeOnDelete();
            $table->foreignId('combo_package_id')->constrained('combo_packages')->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['offer_document_id', 'combo_package_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_document_combo_package');
        Schema::dropIfExists('offer_documents');
    }
};
