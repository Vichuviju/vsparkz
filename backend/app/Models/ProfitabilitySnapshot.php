<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfitabilitySnapshot extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'project_id', 'campaign_id', 'period_start', 'period_end',
        'revenue_amount', 'cost_amount', 'margin_amount', 'margin_percentage', 'calculation_basis',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'revenue_amount' => 'decimal:2',
        'cost_amount' => 'decimal:2',
        'margin_amount' => 'decimal:2',
        'margin_percentage' => 'decimal:2',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
