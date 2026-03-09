<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledExport extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'report_template_id', 'export_type', 'schedule_cron', 'recipients_json',
        'last_run_at', 'next_run_at', 'is_active',
    ];

    protected $casts = [
        'recipients_json' => 'array',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class);
    }
}
