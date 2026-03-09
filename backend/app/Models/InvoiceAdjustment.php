<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceAdjustment extends Model
{
    protected $fillable = ['invoice_id', 'type', 'amount', 'reason'];

    protected $casts = ['amount' => 'decimal:2'];

    public const TYPE_CREDIT_NOTE = 'credit_note';
    public const TYPE_DEBIT_NOTE = 'debit_note';

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
