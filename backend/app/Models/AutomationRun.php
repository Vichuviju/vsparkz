<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutomationRun extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'automation_workflow_id', 'event_key', 'status', 'started_at', 'completed_at', 'log_json',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'log_json' => 'array',
    ];

    public function automationWorkflow(): BelongsTo
    {
        return $this->belongsTo(AutomationWorkflow::class);
    }
}
