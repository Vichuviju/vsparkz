<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdCampaignSync extends Model
{
    use HasFactory;

    protected $fillable = [
        'ad_account_id',
        'synced_at',
        'status',
        'from_date',
        'to_date',
        'metrics_count',
    ];

    protected $casts = [
        'synced_at' => 'datetime',
        'from_date' => 'date',
        'to_date' => 'date',
    ];

    public function adAccount(): BelongsTo
    {
        return $this->belongsTo(AdAccount::class);
    }
}

