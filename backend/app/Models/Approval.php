<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Approval extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'approvable_type', 'approvable_id', 'requested_by', 'requested_at',
        'status', 'decision_by', 'decision_at', 'comment',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'decision_at' => 'datetime',
    ];

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function decisionBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decision_by');
    }
}
