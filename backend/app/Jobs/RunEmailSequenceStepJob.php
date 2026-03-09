<?php

namespace App\Jobs;

use App\Models\EmailSequenceStep;
use App\Services\EmailAutomationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunEmailSequenceStepJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $emailSequenceStepId
    ) {}

    public function handle(EmailAutomationService $emailAutomation): void
    {
        $step = EmailSequenceStep::with('emailSequence')->find($this->emailSequenceStepId);
        if (! $step || ! $step->emailSequence) {
            return;
        }
        $emailAutomation->processDueStep($step);
    }
}
