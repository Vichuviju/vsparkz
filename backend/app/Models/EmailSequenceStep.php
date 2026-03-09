<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailSequenceStep extends Model
{
    protected $fillable = [
        'email_sequence_id', 'step_order', 'delay_minutes', 'template_id', 'action_type', 'action_config_json',
    ];

    protected $casts = [
        'action_config_json' => 'array',
    ];

    public function emailSequence(): BelongsTo
    {
        return $this->belongsTo(EmailSequence::class);
    }
}
