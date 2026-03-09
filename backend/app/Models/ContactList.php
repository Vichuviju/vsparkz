<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactList extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'source', 'size_cache', 'is_dynamic',
    ];

    protected $casts = [
        'is_dynamic' => 'boolean',
    ];

    public function segments(): HasMany
    {
        return $this->hasMany(Segment::class);
    }
}
