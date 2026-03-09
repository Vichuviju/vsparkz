<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LandingTemplate extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'layout_style',
        'animation_defaults',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'layout_style' => 'array',
        'animation_defaults' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public const SLUG_AI_AGENCY = 'ai-agency';
    public const SLUG_ENTERPRISE = 'enterprise-marketing';
    public const SLUG_INFLUENCER = 'influencer-marketing';
    public const SLUG_STARTUP = 'startup-saas';

    public function sections(): HasMany
    {
        return $this->hasMany(LandingSection::class, 'landing_template_id')->orderBy('sort_order');
    }

    public static function getActive(): ?self
    {
        return self::where('is_active', true)->first();
    }
}
