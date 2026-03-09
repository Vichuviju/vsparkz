<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class AutomationEvent extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'event_key', 'description', 'payload_schema_json',
    ];

    protected $casts = [
        'payload_schema_json' => 'array',
    ];
}
