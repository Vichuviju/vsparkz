<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdMetricsDaily extends Model
{
    use HasFactory;
    use BelongsToTenant;

    protected $table = 'ad_metrics_daily';

    protected $fillable = [
        'tenant_id',
        'ad_account_id',
        'campaign_id',
        'campaign_name',
        'date',
        'impressions',
        'clicks',
        'spend',
        'conversions',
        'metadata_json',
    ];

    protected $casts = [
        'date' => 'date',
        'metadata_json' => 'array',
    ];

    public function adAccount(): BelongsTo
    {
        return $this->belongsTo(AdAccount::class);
    }
}

