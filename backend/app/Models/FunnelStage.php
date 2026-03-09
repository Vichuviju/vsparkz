<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FunnelStage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'order', 'default_probability', 'description',
    ];

    protected $casts = [
        'default_probability' => 'decimal:2',
    ];

    public function funnelEvents(): HasMany
    {
        return $this->hasMany(FunnelEvent::class);
    }
}
