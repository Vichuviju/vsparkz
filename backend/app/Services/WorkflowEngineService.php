<?php

namespace App\Services;

use App\Models\WorkflowInstance;
use App\Models\WorkflowTask;
use App\Models\WorkflowTemplate;
use Carbon\Carbon;

class WorkflowEngineService
{
    public function startWorkflow(WorkflowTemplate $template, string $contextType, ?int $contextId = null, ?int $tenantId = null): WorkflowInstance
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $instance = WorkflowInstance::create([
            'tenant_id' => $tenantId,
            'workflow_template_id' => $template->id,
            'context_type' => $contextType,
            'context_id' => $contextId,
            'status' => 'running',
            'started_at' => now(),
            'initiated_by' => auth()->id(),
        ]);
        $baseDate = $instance->started_at ? Carbon::parse($instance->started_at) : now();
        foreach ($template->taskBlueprints as $bp) {
            $dueDate = $bp->relative_due_days !== null ? $baseDate->copy()->addDays($bp->relative_due_days) : null;
            WorkflowTask::create([
                'workflow_instance_id' => $instance->id,
                'task_blueprint_id' => $bp->id,
                'name' => $bp->name,
                'status' => 'pending',
                'due_date' => $dueDate,
            ]);
        }
        return $instance->fresh('workflowTasks');
    }

    public function completeTask(WorkflowTask $task): WorkflowTask
    {
        $task->update(['status' => 'completed', 'completed_at' => now()]);
        $instance = $task->workflowInstance;
        if ($instance->workflowTasks()->where('status', '!=', 'completed')->count() === 0) {
            $instance->update(['status' => 'completed', 'completed_at' => now()]);
        }
        return $task->fresh();
    }
}
