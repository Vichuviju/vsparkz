<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class RevenueCapacityForecast extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'period_start', 'period_end', 'projected_revenue', 'capacity_revenue_ceiling', 'capacity_gap',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'projected_revenue' => 'decimal:2',
        'capacity_revenue_ceiling' => 'decimal:2',
        'capacity_gap' => 'decimal:2',
    ];
}
