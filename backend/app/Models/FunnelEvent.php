<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FunnelEvent extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'funnel_stage_id', 'lead_id', 'deal_id', 'contact_id', 'occurred_at', 'metadata_json',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'metadata_json' => 'array',
    ];

    public function funnelStage(): BelongsTo
    {
        return $this->belongsTo(FunnelStage::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
