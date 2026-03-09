<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignCapacitySnapshot extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'campaign_id', 'snapshot_date', 'workload_score', 'risk_level', 'notes',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'workload_score' => 'decimal:2',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
