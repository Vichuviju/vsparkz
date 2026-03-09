<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTask extends Model
{
    protected $fillable = [
        'workflow_instance_id', 'task_blueprint_id', 'name', 'assignee_id', 'status', 'due_date', 'completed_at',
    ];

    protected $casts = ['due_date' => 'date', 'completed_at' => 'datetime'];

    public function workflowInstance(): BelongsTo
    {
        return $this->belongsTo(WorkflowInstance::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}
