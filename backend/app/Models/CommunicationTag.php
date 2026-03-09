<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunicationTag extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'type',
    ];

    public function communicationTaggables(): HasMany
    {
        return $this->hasMany(CommunicationTaggable::class);
    }
}
