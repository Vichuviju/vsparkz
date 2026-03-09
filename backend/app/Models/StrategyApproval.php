<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StrategyApproval extends Model
{
    use BelongsToTenant;

    protected $table = 'strategy_approvals';

    protected $fillable = [
        'tenant_id', 'client_id', 'campaign_id', 'strategy_report_id', 'status', 'approved_by', 'approved_at', 'comment',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function strategyReport(): BelongsTo
    {
        return $this->belongsTo(StrategyReport::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
