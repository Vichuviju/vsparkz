<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequirementDocument extends Model
{
    protected $fillable = ['requirement_gathering_id', 'media_id', 'file_path', 'original_name'];

    public function requirementGathering(): BelongsTo
    {
        return $this->belongsTo(RequirementGathering::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
