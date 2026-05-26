<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InfluencerEngagementLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'influencer_id',
        'engagement_rate',
        'followers',
        'instagram_followers',
        'youtube_followers',
        'log_date',
        'tenant_id',
    ];

    protected $casts = [
        'engagement_rate' => 'decimal:2',
        'followers' => 'integer',
        'instagram_followers' => 'integer',
        'youtube_followers' => 'integer',
        'log_date' => 'date',
    ];

    public function influencer(): BelongsTo
    {
        return $this->belongsTo(Influencer::class);
    }
}
