<?php

use App\Jobs\DeliverScheduledExportJob;
use App\Jobs\RunEmailSequenceStepJob;
use App\Jobs\RunRankingCheckJob;
use App\Jobs\SyncAdAccountMetricsJob;
use App\Models\AdAccount;
use App\Models\Keyword;
use App\Models\ScheduledExport;
use App\Services\SettingsLoaderService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// DMOS scheduled tasks
$settings = app(SettingsLoaderService::class);

Schedule::call(function () use ($settings) {
    if (! $settings->getBoolean('queue.ads_sync_enabled', true)) {
        return;
    }
    AdAccount::whereNotNull('tenant_id')->chunkById(50, function ($accounts) {
        foreach ($accounts as $a) {
            SyncAdAccountMetricsJob::dispatch($a->id);
        }
    });
})->daily()->name('dmos:sync-ads');

Schedule::call(function () use ($settings) {
    if (! $settings->getBoolean('queue.seo_ranking_check_enabled', true)) {
        return;
    }
    Keyword::where('status', 'active')->chunkById(100, function ($keywords) {
        foreach ($keywords as $k) {
            RunRankingCheckJob::dispatch($k->id, $k->tenant_id);
        }
    });
})->daily()->name('dmos:ranking-check');

Schedule::call(function () {
    // Stub: in a full implementation, find contacts enrolled in sequences whose next step is due (delay_minutes elapsed)
    // and dispatch RunEmailSequenceStepJob for each. No enrollment table yet, so no-op.
})->hourly()->name('dmos:email-sequence-steps');

Schedule::call(function () use ($settings) {
    if (! $settings->getBoolean('queue.scheduled_exports_enabled', true)) {
        return;
    }
    $due = ScheduledExport::where('is_active', true)
        ->whereNotNull('next_run_at')
        ->where('next_run_at', '<=', now())
        ->get();
    foreach ($due as $export) {
        DeliverScheduledExportJob::dispatch($export->id);
    }
})->daily()->name('dmos:deliver-scheduled-exports');
