<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiTemplate extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'use_case', 'prompt_template',
        'input_schema_json', 'output_schema_json', 'default_provider', 'default_model',
    ];

    protected $casts = [
        'input_schema_json' => 'array',
        'output_schema_json' => 'array',
    ];

    public function aiRequests(): HasMany
    {
        return $this->hasMany(AiRequest::class);
    }
}
