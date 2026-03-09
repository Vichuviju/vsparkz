<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LandingSection extends Model
{
    protected $fillable = [
        'landing_template_id',
        'type',
        'layout_variant',
        'sort_order',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public const TYPE_HERO = 'hero';
    public const TYPE_LOGOS = 'logos';
    public const TYPE_SERVICES = 'services';
    public const TYPE_ABOUT = 'about';
    public const TYPE_METRICS = 'metrics';
    public const TYPE_INFLUENCER = 'influencer_highlight';
    public const TYPE_TESTIMONIALS = 'testimonials';
    public const TYPE_CASE_STUDIES = 'case_studies';
    public const TYPE_CTA = 'cta';
    public const TYPE_FOOTER_CTA = 'footer_cta';

    public function template(): BelongsTo
    {
        return $this->belongsTo(LandingTemplate::class, 'landing_template_id');
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(LandingBlock::class, 'landing_section_id')->orderBy('sort_order');
    }
}
