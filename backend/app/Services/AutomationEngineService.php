<?php

namespace App\Services;

use App\Jobs\RunAutomationWorkflowJob;
use App\Models\AutomationWorkflow;
use App\Models\AutomationRun;

class AutomationEngineService
{
    public function listWorkflows($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return AutomationWorkflow::where('tenant_id', $tid)->where('is_active', true)->orderBy('name')->get();
    }

    public function createWorkflow(array $data, $tid = null): AutomationWorkflow
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        $data['created_by'] = $data['created_by'] ?? auth()->id();
        return AutomationWorkflow::create($data);
    }

    public function updateWorkflow(AutomationWorkflow $wf, array $data): AutomationWorkflow
    {
        $wf->update($data);
        return $wf->fresh();
    }

    public function dispatchWorkflow(AutomationWorkflow $workflow, string $eventKey, array $payload = []): void
    {
        RunAutomationWorkflowJob::dispatch($workflow->id, $eventKey, $payload);
    }

    public function createRun(AutomationWorkflow $wf, string $eventKey, $tid = null): AutomationRun
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return AutomationRun::create([
            'tenant_id' => $tid,
            'automation_workflow_id' => $wf->id,
            'event_key' => $eventKey,
            'status' => 'running',
            'started_at' => now(),
        ]);
    }
}
