<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentCalendarItem extends Model
{
    protected $fillable = [
        'project_id',
        'campaign_id',
        'scheduled_date',
        'content_type',
        'title',
        'raw_content',
        'status',
        'influencer_id',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function influencer(): BelongsTo
    {
        return $this->belongsTo(Influencer::class);
    }
}
