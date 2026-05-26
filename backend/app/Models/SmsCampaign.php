<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmsCampaign extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'message',
        'scheduled_at',
        'status',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(SmsLog::class);
    }

    public function scopeForTenant($query)
    {
        if (auth()->check()) {
            return $query->where('tenant_id', auth()->user()->tenant_id ?? auth()->user()->agency_id);
        }
        return $query;
    }
}
