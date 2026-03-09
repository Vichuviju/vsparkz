<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class AutomationAction extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'action_key', 'description', 'config_schema_json',
    ];

    protected $casts = [
        'config_schema_json' => 'array',
    ];
}
