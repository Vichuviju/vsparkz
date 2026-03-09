<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdAccount extends Model
{
    use HasFactory;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'integration_id',
        'platform',
        'account_id',
        'name',
        'is_active',
    ];

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function syncs(): HasMany
    {
        return $this->hasMany(AdCampaignSync::class);
    }

    public function metrics(): HasMany
    {
        return $this->hasMany(AdMetricsDaily::class);
    }
}

