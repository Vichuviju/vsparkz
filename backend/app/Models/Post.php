<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'content_calendar_item_id',
        'social_account_id',
        'campaign_id',
        'content_json',
        'media_assets',
        'scheduled_at',
        'published_at',
        'status',
        'external_id',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
            'media_assets' => 'array',
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contentCalendarItem(): BelongsTo
    {
        return $this->belongsTo(ContentCalendarItem::class);
    }

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PostVersion::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(PostApproval::class);
    }

    public function publishJobs(): HasMany
    {
        return $this->hasMany(PublishJob::class);
    }
}

