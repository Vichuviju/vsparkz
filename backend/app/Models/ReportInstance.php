<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportInstance extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'report_template_id',
        'context_type',
        'context_id',
        'generated_at',
        'generated_by',
        'snapshot_json',
        'is_scheduled',
    ];

    protected $casts = [
        'snapshot_json' => 'array',
        'generated_at' => 'datetime',
        'is_scheduled' => 'boolean',
    ];

    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class);
    }

    public function generatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
