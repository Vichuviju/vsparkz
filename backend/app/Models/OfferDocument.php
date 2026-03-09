<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class OfferDocument extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'pricing_title',
        'limited_offer_text',
        'sidebar_features',
        'payment_note',
        'logo_path',
        'company_name',
        'tagline',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'sidebar_features' => 'array',
        'is_active' => 'boolean',
    ];

    public function comboPackages(): BelongsToMany
    {
        return $this->belongsToMany(ComboPackage::class, 'offer_document_combo_package')
            ->withPivot('sort_order')
            ->orderBy('offer_document_combo_package.sort_order');
    }

    protected static function booted(): void
    {
        static::creating(function (OfferDocument $doc): void {
            if (empty($doc->slug)) {
                $doc->slug = Str::slug($doc->name);
            }
        });
    }
}
