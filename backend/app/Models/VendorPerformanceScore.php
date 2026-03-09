<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPerformanceScore extends Model
{
    protected $fillable = [
        'vendor_id', 'period_start', 'period_end', 'score', 'metrics_json', 'reviewer_id',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'score' => 'decimal:2',
        'metrics_json' => 'array',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
