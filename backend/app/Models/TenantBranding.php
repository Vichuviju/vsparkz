<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TenantBranding extends Model
{
    protected $table = 'tenant_branding';

    protected $fillable = [
        'tenant_id', 'primary_color', 'secondary_color', 'logo_path', 'favicon_path',
        'login_background_path', 'brand_name', 'support_email', 'support_url',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class, 'tenant_id', 'tenant_id');
    }

    public function emailIdentities(): HasMany
    {
        return $this->hasMany(EmailIdentity::class, 'tenant_id', 'tenant_id');
    }
}
