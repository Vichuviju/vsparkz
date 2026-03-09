<?php

namespace App\Jobs;

use App\Jobs\GenerateReportInstanceJob;
use App\Models\ScheduledExport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DeliverScheduledExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $scheduledExportId
    ) {}

    public function handle(): void
    {
        $export = ScheduledExport::with('reportTemplate')->find($this->scheduledExportId);
        if (! $export || ! $export->is_active || ! $export->reportTemplate) {
            return;
        }
        GenerateReportInstanceJob::dispatch(
            $export->report_template_id,
            null,
            null,
            $export->tenant_id,
            null
        );
        $export->update([
            'last_run_at' => now(),
            'next_run_at' => null,
        ]);
    }
}
