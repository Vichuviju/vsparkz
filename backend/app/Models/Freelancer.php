<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Freelancer extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'name', 'email', 'phone', 'skills', 'service_category_ids', 'pricing',
        'portfolio_links', 'delivery_days', 'commission_percent', 'company_or_individual',
        'availability', 'user_id', 'tenant_id', 'agency_id', 'is_active',
    ];

    protected $casts = [
        'skills' => 'array',
        'service_category_ids' => 'array',
        'pricing' => 'array',
        'portfolio_links' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(FreelancerRating::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(FreelancerRequest::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /** Read: agency_id is an alias for tenant_id (column was renamed in evolve migration). */
    public function getAgencyIdAttribute(): mixed
    {
        return $this->attributes['tenant_id'] ?? null;
    }

    /** Write: set agency_id on the model actually sets tenant_id so SQL uses tenant_id. */
    public function setAgencyIdAttribute(mixed $value): void
    {
        $this->attributes['tenant_id'] = $value;
        unset($this->attributes['agency_id']);
    }

    public function masterPricing(): HasMany
    {
        return $this->hasMany(FreelancerMasterPricing::class);
    }
}
