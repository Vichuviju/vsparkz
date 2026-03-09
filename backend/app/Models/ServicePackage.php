<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServicePackage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'slug', 'description', 'base_price', 'currency', 'pricing_model', 'active',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ServicePackageItem::class);
    }

    public function rules(): HasMany
    {
        return $this->hasMany(ServicePackageRule::class);
    }
}
