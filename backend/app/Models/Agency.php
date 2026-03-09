<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Alias for Tenant (table: tenants). Use Tenant for new code.
 * Kept for backward compatibility during transition.
 */
class Agency extends Model
{
    protected $table = 'tenants';

    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'primary_color',
        'domain',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'tenant_id');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'tenant_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'tenant_id');
    }
}
