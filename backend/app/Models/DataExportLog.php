<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataExportLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'initiated_by', 'export_type', 'entity_type', 'entity_ids_json',
        'status', 'generated_at', 'downloaded_at',
    ];

    protected $casts = [
        'entity_ids_json' => 'array',
        'generated_at' => 'datetime',
        'downloaded_at' => 'datetime',
    ];

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }
}
