<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'agency_id', // alias for tenant_id (redirected in mutator; no DB column after evolve)
        'company_name',
        'contact_name',
        'email',
        'phone',
        'address',
        'tax_id',
        'notes',
        'lead_id',
        'source',
        'user_id',
    ];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function agreements(): HasMany
    {
        return $this->hasMany(Agreement::class);
    }

    public function strategyReports(): HasMany
    {
        return $this->hasMany(StrategyReport::class);
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
}
