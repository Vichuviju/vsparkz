<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeCostMapping extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'time_log_id', 'cost_amount', 'currency', 'calculated_at',
    ];

    protected $casts = [
        'cost_amount' => 'decimal:2',
        'calculated_at' => 'datetime',
    ];

    public function timeLog(): BelongsTo
    {
        return $this->belongsTo(TimeLog::class);
    }
}
