<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class AiUsage extends Model
{
    use BelongsToTenant;

    protected $table = 'ai_usage';

    protected $fillable = [
        'tenant_id', 'provider', 'model', 'tokens_in', 'tokens_out', 'cost_minor_units',
        'currency', 'period_start', 'period_end',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
    ];
}
