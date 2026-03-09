<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'slug', 'client_id', 'default_currency', 'time_zone', 'brand_guideline_id',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    public function brandAssignables(): HasMany
    {
        return $this->hasMany(BrandAssignable::class);
    }
}
