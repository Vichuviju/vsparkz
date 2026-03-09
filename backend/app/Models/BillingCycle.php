<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingCycle extends Model
{
    protected $fillable = [
        'client_subscription_id', 'cycle_start', 'cycle_end', 'invoice_id', 'amount', 'currency', 'status', 'notes',
    ];

    protected $casts = [
        'cycle_start' => 'date',
        'cycle_end' => 'date',
        'amount' => 'decimal:2',
    ];

    public function clientSubscription(): BelongsTo
    {
        return $this->belongsTo(ClientSubscription::class);
    }
}
