<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorRateCard extends Model
{
    protected $fillable = [
        'vendor_id', 'service_id', 'sub_service_id', 'rate_type', 'rate_amount', 'currency',
        'effective_from', 'effective_to',
    ];

    protected $casts = [
        'rate_amount' => 'decimal:2',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
