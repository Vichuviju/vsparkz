<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class TrackingSource extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'source_type', 'config_json',
    ];

    protected $casts = [
        'config_json' => 'array',
    ];
}
