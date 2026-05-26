<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InfluencerCategory extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'name',
        'tenant_id',
    ];

    public function influencers(): HasMany
    {
        return $this->hasMany(Influencer::class, 'content_category_id');
    }
}
