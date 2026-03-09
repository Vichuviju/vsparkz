<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageBlock extends Model
{
    protected $fillable = [
        'page_section_id',
        'type',
        'content',
        'media_id',
        'aspect_ratio',
        'animation_settings',
        'cta_config',
        'sort_order',
    ];

    protected $casts = [
        'content' => 'array',
        'animation_settings' => 'array',
        'cta_config' => 'array',
        'sort_order' => 'integer',
    ];

    public const TYPE_HEADLINE = 'headline';
    public const TYPE_CTA = 'cta';
    public const TYPE_MEDIA = 'media';
    public const TYPE_TEXT = 'text';
    public const TYPE_METRICS = 'metrics';
    public const TYPE_VIDEO = 'video';

    public function section(): BelongsTo
    {
        return $this->belongsTo(PageSection::class, 'page_section_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
