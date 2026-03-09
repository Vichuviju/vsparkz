<?php

namespace App\Jobs;

use App\Models\AdAccount;
use App\Models\AdCampaignSync;
use App\Models\AdMetricsDaily;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncAdAccountMetricsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $adAccountId,
        public ?string $fromDate = null,
        public ?string $toDate = null
    ) {}

    public function handle(): void
    {
        $account = AdAccount::find($this->adAccountId);
        if (!$account) {
            return;
        }
        $from = $this->fromDate ?? now()->subDays(7)->toDateString();
        $to = $this->toDate ?? now()->toDateString();

        $sync = AdCampaignSync::create([
            'ad_account_id' => $account->id,
            'status' => 'running',
            'from_date' => $from,
            'to_date' => $to,
        ]);

        try {
            // Stub: real implementation would call Meta/Google API and normalize into ad_metrics_daily
            $sync->update([
                'status' => 'completed',
                'synced_at' => now(),
                'metrics_count' => 0,
            ]);
        } catch (\Throwable $e) {
            $sync->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
