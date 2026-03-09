<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Segment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'definition_json', 'contact_list_id',
    ];

    protected $casts = [
        'definition_json' => 'array',
    ];

    public function contactList(): BelongsTo
    {
        return $this->belongsTo(ContactList::class);
    }
}
