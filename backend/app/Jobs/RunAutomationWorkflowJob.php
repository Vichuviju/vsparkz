<?php

namespace App\Jobs;

use App\Models\AutomationRun;
use App\Models\AutomationWorkflow;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunAutomationWorkflowJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $automationWorkflowId,
        public string $eventKey,
        public array $payload = []
    ) {}

    public function handle(): void
    {
        $workflow = AutomationWorkflow::find($this->automationWorkflowId);
        if (! $workflow || ! $workflow->is_active) {
            return;
        }
        $run = AutomationRun::create([
            'tenant_id' => $workflow->tenant_id,
            'automation_workflow_id' => $workflow->id,
            'event_key' => $this->eventKey,
            'status' => 'running',
            'started_at' => now(),
            'log_json' => ['payload' => $this->payload],
        ]);
        try {
            // Stub: evaluate conditions from definition_json and dispatch actions
            $run->update([
                'status' => 'completed',
                'completed_at' => now(),
                'log_json' => array_merge($run->log_json ?? [], ['completed' => true]),
            ]);
        } catch (\Throwable $e) {
            $run->update([
                'status' => 'failed',
                'completed_at' => now(),
                'log_json' => array_merge($run->log_json ?? [], ['error' => $e->getMessage()]),
            ]);
            throw $e;
        }
    }
}
