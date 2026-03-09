<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PricingLevel extends Model
{
    protected $fillable = ['slug', 'label', 'sort_order'];

    public function servicePrices(): HasMany
    {
        return $this->hasMany(ServicePrice::class);
    }
}
