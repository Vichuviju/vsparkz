<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SendLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'email_sequence_id', 'email_sequence_step_id', 'recipient_email', 'contact_id',
        'provider_message_id', 'status', 'error_message',
        'sent_at', 'delivered_at', 'opened_at', 'clicked_at', 'bounced_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'opened_at' => 'datetime',
        'clicked_at' => 'datetime',
        'bounced_at' => 'datetime',
    ];

    public function emailSequence(): BelongsTo
    {
        return $this->belongsTo(EmailSequence::class);
    }

    public function engagementEvents(): HasMany
    {
        return $this->hasMany(EngagementEvent::class);
    }
}
