<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowInstance extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'workflow_template_id', 'context_type', 'context_id',
        'status', 'started_at', 'completed_at', 'initiated_by',
    ];

    protected $casts = ['started_at' => 'datetime', 'completed_at' => 'datetime'];

    public function workflowTemplate(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class);
    }

    public function initiatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function workflowTasks(): HasMany
    {
        return $this->hasMany(WorkflowTask::class);
    }
}
