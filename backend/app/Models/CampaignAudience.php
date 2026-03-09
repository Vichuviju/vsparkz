<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignAudience extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'campaign_id',
        'name',
        'criteria_json',
    ];

    protected function casts(): array
    {
        return [
            'criteria_json' => 'array',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}

