<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory, BelongsToTenant;

    public const STATUS_NEW = 'new';
    public const STATUS_CONTACTED = 'contacted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_HOLD = 'hold';
    public const STATUS_FOLLOW_BACK = 'follow_back';
    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'tenant_id',
        'agency_id', // alias for tenant_id (redirected in mutator; no DB column after evolve)
        'name',
        'email',
        'phone',
        'company',
        'service_id',
        'subject',
        'message',
        'status',
        'notes',
        'source',
        'assigned_to',
        'follow_up_date',
        'lead_source',
        'do_not_call',
        'converted_to_client_id',
        'next_step',
        'next_step_date',
        'selected_combo_package_id',
        'custom_package_data',
        'pricing_type',
    ];

    protected $casts = [
        'custom_package_data' => 'array',
        'follow_up_date' => 'date',
        'do_not_call' => 'boolean',
        'next_step_date' => 'date',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(LeadStatusHistory::class)->orderByDesc('created_at');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->orderByDesc('created_at');
    }

    public function convertedToClient(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'converted_to_client_id');
    }

    public function selectedComboPackage(): BelongsTo
    {
        return $this->belongsTo(ComboPackage::class, 'selected_combo_package_id');
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
