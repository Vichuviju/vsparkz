<?php

namespace App\Services;

use App\Jobs\SyncAdAccountMetricsJob;
use App\Models\AdAccount;

class AdSyncService
{
    public function dispatchSyncForAccount(AdAccount $account): void
    {
        SyncAdAccountMetricsJob::dispatch($account);
    }

    public function dispatchSyncForTenant($tenantId = null): void
    {
        $tid = $tenantId ?: auth()->user()?->tenant_id;
        $list = AdAccount::where('tenant_id', $tid)->get();
        foreach ($list as $a) {
            SyncAdAccountMetricsJob::dispatch($a);
        }
    }
}
