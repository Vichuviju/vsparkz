<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceForecast extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'period_start', 'period_end', 'user_id', 'role',
        'hours_available', 'hours_booked', 'hours_forecasted', 'utilization_percentage',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'hours_available' => 'decimal:2',
        'hours_booked' => 'decimal:2',
        'hours_forecasted' => 'decimal:2',
        'utilization_percentage' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
