<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskBlueprint extends Model
{
    protected $fillable = ['workflow_template_id', 'name', 'description', 'role', 'order', 'relative_due_days'];

    public function workflowTemplate(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class);
    }
}
