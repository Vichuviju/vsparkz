<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiRequest extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'ai_template_id', 'provider', 'model', 'input_json', 'output_json',
        'status', 'latency_ms', 'error_message', 'requested_by', 'requested_at',
    ];

    protected $casts = [
        'input_json' => 'array',
        'output_json' => 'array',
        'requested_at' => 'datetime',
    ];

    public function aiTemplate(): BelongsTo
    {
        return $this->belongsTo(AiTemplate::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
