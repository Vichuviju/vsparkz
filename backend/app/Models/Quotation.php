<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    protected $fillable = [
        'client_id',
        'project_id',
        'number',
        'title',
        'items',
        'time_period',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
        'status',
        'valid_until',
        'rejection_reason',
        'file_path',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'valid_until' => 'date',
    ];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SENT = 'sent';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';

    public const TIME_PERIOD_WEEKLY = 'weekly';
    public const TIME_PERIOD_MONTHLY = 'monthly';
    public const TIME_PERIOD_YEARLY = 'yearly';

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function quotationServices(): HasMany
    {
        return $this->hasMany(QuotationService::class)->orderBy('sort_order');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'quotation_id');
    }
}
