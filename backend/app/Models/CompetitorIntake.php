<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitorIntake extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'client_id', 'competitor_domain', 'notes', 'positioning',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
