<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class HiringRequirement extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'period_start', 'period_end', 'role', 'required_headcount', 'justification', 'status',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
    ];
}
