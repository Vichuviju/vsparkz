<?php

namespace App\Jobs;

use App\Models\ReportInstance;
use App\Models\ReportTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateReportInstanceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $reportTemplateId,
        public ?string $contextType = null,
        public ?int $contextId = null,
        public ?int $tenantId = null,
        public ?int $generatedBy = null
    ) {}

    public function handle(): void
    {
        $template = ReportTemplate::find($this->reportTemplateId);
        if (!$template) {
            return;
        }
        $tenantId = $this->tenantId ?? $template->tenant_id;
        ReportInstance::create([
            'tenant_id' => $tenantId,
            'report_template_id' => $template->id,
            'context_type' => $this->contextType,
            'context_id' => $this->contextId,
            'generated_at' => now(),
            'generated_by' => $this->generatedBy,
            'is_scheduled' => true,
        ]);
    }
}
