<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorAvailability extends Model
{
    protected $fillable = [
        'vendor_id', 'date', 'available_hours', 'status',
    ];

    protected $casts = [
        'date' => 'date',
        'available_hours' => 'decimal:2',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
