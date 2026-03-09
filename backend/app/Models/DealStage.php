<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DealStage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'pipeline_name',
        'name',
        'order',
        'is_default',
    ];

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'current_stage_id');
    }
}
