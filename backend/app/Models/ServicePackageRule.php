<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServicePackageRule extends Model
{
    protected $fillable = [
        'service_package_id', 'rule_type', 'config_json',
    ];

    protected $casts = [
        'config_json' => 'array',
    ];

    public function servicePackage(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class);
    }
}
