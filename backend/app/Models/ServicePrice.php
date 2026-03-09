<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServicePrice extends Model
{
    protected $fillable = [
        'service_id',
        'sub_service_id',
        'pricing_level_id',
        'amount',
        'duration_value',
        'duration_unit',
        'frequency',
    ];

    protected $casts = ['amount' => 'decimal:2'];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function subService(): BelongsTo
    {
        return $this->belongsTo(SubService::class);
    }

    public function pricingLevel(): BelongsTo
    {
        return $this->belongsTo(PricingLevel::class);
    }
}
