<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Location extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'brand_id', 'name', 'address_json', 'time_zone', 'status',
    ];

    protected $casts = [
        'address_json' => 'array',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
