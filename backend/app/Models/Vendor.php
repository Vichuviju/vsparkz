<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'type', 'contact_email', 'contact_phone', 'location', 'notes',
    ];

    public function rateCards(): HasMany
    {
        return $this->hasMany(VendorRateCard::class);
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(VendorAvailability::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(VendorContract::class);
    }

    public function performanceScores(): HasMany
    {
        return $this->hasMany(VendorPerformanceScore::class);
    }
}
