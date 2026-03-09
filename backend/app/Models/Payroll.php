<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    protected $fillable = [
        'user_id',
        'period_start',
        'period_end',
        'base_amount',
        'adjustments',
        'total',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'base_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'adjustments' => 'array',
        'paid_at' => 'datetime',
    ];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID = 'paid';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
