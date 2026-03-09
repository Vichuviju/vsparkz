<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CommunicationTaggable extends Model
{
    protected $fillable = [
        'communication_tag_id', 'taggable_type', 'taggable_id',
    ];

    public function communicationTag(): BelongsTo
    {
        return $this->belongsTo(CommunicationTag::class);
    }

    public function taggable(): MorphTo
    {
        return $this->morphTo();
    }
}
