<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Integration extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'slug',
        'name',
        'type',
        'category',
        'config_schema',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'config_schema' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(IntegrationCredential::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(IntegrationLog::class);
    }
}

