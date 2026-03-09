<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingBlock extends Model
{
    protected $fillable = [
        'landing_section_id',
        'type',
        'content',
        'media_id',
        'aspect_ratio',
        'alignment',
        'object_fit',
        'animation_config',
        'sort_order',
    ];

    protected $casts = [
        'content' => 'array',
        'animation_config' => 'array',
        'sort_order' => 'integer',
    ];

    public const TYPE_HEADLINE = 'headline';
    public const TYPE_SUBHEADLINE = 'subheadline';
    public const TYPE_PARAGRAPH = 'paragraph';
    public const TYPE_CTA = 'cta';
    public const TYPE_IMAGE = 'image';
    public const TYPE_VIDEO = 'video';
    public const TYPE_LOGO_GRID = 'logo_grid';
    public const TYPE_ICON_LIST = 'icon_list';
    public const TYPE_COUNTER = 'counter';

    public function section(): BelongsTo
    {
        return $this->belongsTo(LandingSection::class, 'landing_section_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
