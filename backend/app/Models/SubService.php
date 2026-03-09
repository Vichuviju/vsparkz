<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubService extends Model
{
    protected $fillable = [
        'service_id',
        'name',
        'description',
        'average_price',
        'average_duration_value',
        'average_duration_unit',
        'service_type',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'average_price' => 'decimal:2',
        'freelance_price' => 'decimal:2',
    ];

    /** Price for given pricing type (average = in-house, freelance = freelance_rate). */
    public function getPriceForType(?string $pricingType): ?float
    {
        if ($pricingType === 'freelance' && $this->freelance_price !== null) {
            return (float) $this->freelance_price;
        }
        return $this->average_price !== null ? (float) $this->average_price : null;
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function servicePrices(): HasMany
    {
        return $this->hasMany(ServicePrice::class);
    }
}
