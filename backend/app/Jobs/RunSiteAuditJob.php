<?php

namespace App\Jobs;

use App\Models\SiteAudit;
use App\Services\SeoWorkspaceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunSiteAuditJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $siteAuditId,
        public ?int $tenantId = null
    ) {}

    public function handle(SeoWorkspaceService $seo): void
    {
        $audit = SiteAudit::find($this->siteAuditId);
        if (! $audit) {
            return;
        }
        $tenantId = $this->tenantId ?? $audit->tenant_id;
        $seo->runSiteAudit($audit, $tenantId);
    }
}
