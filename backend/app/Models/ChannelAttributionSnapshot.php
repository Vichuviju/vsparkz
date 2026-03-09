<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ChannelAttributionSnapshot extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'period_start', 'period_end', 'channel', 'leads_count', 'deals_count',
        'revenue_amount', 'attribution_model', 'calculation_json',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'revenue_amount' => 'decimal:2',
    ];
}
