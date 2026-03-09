<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerMasterPricing extends Model
{
    protected $table = 'freelancer_master_pricing';

    protected $fillable = [
        'freelancer_id',
        'sub_service_id',
        'service_id',
        'pricing_level_id',
        'time_period',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    public function subService(): BelongsTo
    {
        return $this->belongsTo(SubService::class, 'sub_service_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function pricingLevel(): BelongsTo
    {
        return $this->belongsTo(PricingLevel::class);
    }
}
