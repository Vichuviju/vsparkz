<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailIdentity extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'email', 'provider', 'integration_id', 'is_default', 'verified_at',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }
}
