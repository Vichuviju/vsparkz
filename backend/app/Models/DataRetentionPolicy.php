<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class DataRetentionPolicy extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'entity_type', 'retention_months', 'policy_json', 'effective_from',
    ];

    protected $casts = [
        'policy_json' => 'array',
        'effective_from' => 'date',
    ];
}
