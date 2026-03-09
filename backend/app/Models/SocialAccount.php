<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialAccount extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'integration_id',
        'platform',
        'account_id',
        'name',
        'credentials_ref',
        'is_active',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}

