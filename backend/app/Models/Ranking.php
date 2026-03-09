<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ranking extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'keyword_id', 'search_engine', 'device_type', 'country',
        'position', 'ranked_url', 'captured_at',
    ];

    protected $casts = [
        'captured_at' => 'datetime',
    ];

    public function keyword(): BelongsTo
    {
        return $this->belongsTo(Keyword::class);
    }
}
