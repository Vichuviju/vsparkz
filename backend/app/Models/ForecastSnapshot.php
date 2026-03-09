<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ForecastSnapshot extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'snapshot_date',
        'pipeline_name',
        'total_pipeline_value',
        'weighted_pipeline_value',
        'expected_revenue_next_30d',
        'expected_revenue_next_90d',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'total_pipeline_value' => 'decimal:2',
        'weighted_pipeline_value' => 'decimal:2',
        'expected_revenue_next_30d' => 'decimal:2',
        'expected_revenue_next_90d' => 'decimal:2',
    ];
}
