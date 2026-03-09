<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComboPackageItem extends Model
{
    protected $fillable = ['combo_package_id', 'service_id', 'sub_service_id', 'pricing_level_id', 'quantity'];

    public function comboPackage(): BelongsTo
    {
        return $this->belongsTo(ComboPackage::class);
    }

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
