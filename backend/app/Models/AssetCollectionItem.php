<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetCollectionItem extends Model
{
    protected $fillable = [
        'asset_collection_id', 'asset_id', 'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    public function assetCollection(): BelongsTo
    {
        return $this->belongsTo(AssetCollection::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
