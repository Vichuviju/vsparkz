<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EngagementEvent extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'contact_id', 'send_log_id', 'event_type', 'event_payload_json', 'occurred_at',
    ];

    protected $casts = [
        'event_payload_json' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function sendLog(): BelongsTo
    {
        return $this->belongsTo(SendLog::class);
    }
}
