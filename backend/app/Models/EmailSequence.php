<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailSequence extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'default_sender_identity_id', 'email_automation_rule_id',
    ];

    public function emailAutomationRule(): BelongsTo
    {
        return $this->belongsTo(EmailAutomationRule::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(EmailSequenceStep::class, 'email_sequence_id')->orderBy('step_order');
    }

    public function sendLogs(): HasMany
    {
        return $this->hasMany(SendLog::class, 'email_sequence_id');
    }
}
