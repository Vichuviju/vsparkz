<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Influencer extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'profile_image',
        'platform',
        'followers',
        'youtube_followers',
        'instagram_followers',
        'engagement_rate',
        'language',
        'location',
        'category',
        'content_category_id',
        'email',
        'phone',
        'meta',
        'source',
        'enrolled_at',
        'status',
        'work_status',
        'growth_status',
        'gender_ratio',
        'male_percentage',
        'female_percentage',
        'location_ratio',
        'peak_time',
        'pricing_per_post',
        'pricing_per_reel',
        'pricing_per_story',
        'assigned_team_member_id',
        'reporting_manager_id',
        'last_analytics_updated',
        'expected_growth_notes',
    ];

    protected $casts = [
        'followers' => 'integer',
        'youtube_followers' => 'integer',
        'instagram_followers' => 'integer',
        'engagement_rate' => 'decimal:2',
        'male_percentage' => 'decimal:2',
        'female_percentage' => 'decimal:2',
        'pricing_per_post' => 'decimal:2',
        'pricing_per_reel' => 'decimal:2',
        'pricing_per_story' => 'decimal:2',
        'enrolled_at' => 'date',
        'last_analytics_updated' => 'date',
        'meta' => 'array',
    ];

    public const STATUS_NEW = 'new';
    public const STATUS_SHORTLISTED = 'shortlisted';
    public const STATUS_ASSIGNED = 'assigned';

    public function contentCategory(): BelongsTo
    {
        return $this->belongsTo(InfluencerCategory::class, 'content_category_id');
    }

    public function engagementLogs(): HasMany
    {
        return $this->hasMany(InfluencerEngagementLog::class)->orderByDesc('log_date');
    }

    public function assignedMember(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_team_member_id');
    }

    public function reportingManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporting_manager_id');
    }
}
