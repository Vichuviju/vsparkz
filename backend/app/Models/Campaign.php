<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Campaign extends Model
{
    use HasFactory;
    use BelongsToTenant;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_PAUSED = 'paused';

    public const TYPE_META_ADS = 'meta_ads';
    public const TYPE_GOOGLE_ADS = 'google_ads';
    public const TYPE_EMAIL = 'email';
    public const TYPE_INFLUENCER = 'influencer';

    protected $fillable = [
        'tenant_id',
        'project_id',
        'client_id',
        'name',
        'campaign_type',
        'client',
        'influencer_name',
        'platform',
        'influencer_reach',
        'engagement_rate',
        'result_summary',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function clientRelation(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }
}
