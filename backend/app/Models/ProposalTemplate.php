<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalTemplate extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'content_json', 'default_package_id',
    ];

    protected $casts = [
        'content_json' => 'array',
    ];

    public function defaultPackage(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class, 'default_package_id');
    }
}
