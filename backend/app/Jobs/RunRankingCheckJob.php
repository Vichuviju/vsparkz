<?php

namespace App\Jobs;

use App\Models\Keyword;
use App\Services\SeoWorkspaceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunRankingCheckJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $keywordId,
        public ?int $tenantId = null
    ) {}

    public function handle(SeoWorkspaceService $seo): void
    {
        $keyword = Keyword::find($this->keywordId);
        if (! $keyword) {
            return;
        }
        $tenantId = $this->tenantId ?? $keyword->tenant_id;
        $seo->fetchRankingsForKeyword($keyword, $tenantId);
    }
}
