<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'client_id',
        'quotation_id',
        'number',
        'items',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
        'status',
        'invoice_type',
        'milestone_label',
        'due_date',
        'paid_at',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    protected $appends = ['balance_due'];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SENT = 'sent';
    public const STATUS_PAID = 'paid';
    public const STATUS_OVERDUE = 'overdue';

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Scope to invoices whose client belongs to the given tenant (or current user's tenant).
     * Invoice has no tenant_id; scoping is via client.tenant_id.
     */
    public function scopeForAgency(Builder $query, $tenantId = null): Builder
    {
        $id = $tenantId ?? auth()->user()?->tenant_id ?? auth()->user()?->agency_id;
        if ($id === null) {
            return $query;
        }
        return $query->whereHas('client', fn (Builder $q) => $q->where('tenant_id', $id));
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(InvoiceAdjustment::class);
    }

    /** Balance due: total - payments + debit_notes - credit_notes */
    public function getBalanceDueAttribute(): float
    {
        $total = (float) $this->total;
        $paid = (float) $this->payments()->sum('amount');
        $credit = (float) $this->adjustments()->where('type', InvoiceAdjustment::TYPE_CREDIT_NOTE)->sum('amount');
        $debit = (float) $this->adjustments()->where('type', InvoiceAdjustment::TYPE_DEBIT_NOTE)->sum('amount');
        return $total - $paid - $credit + $debit;
    }
}
