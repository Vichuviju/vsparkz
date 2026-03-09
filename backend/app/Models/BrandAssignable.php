<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BrandAssignable extends Model
{
    protected $fillable = [
        'brand_id', 'assignable_type', 'assignable_id',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function assignable(): MorphTo
    {
        return $this->morphTo();
    }
}
