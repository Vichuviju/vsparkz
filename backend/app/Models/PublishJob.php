<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublishJob extends Model
{
    protected $fillable = [
        'post_id',
        'job_uuid',
        'status',
        'result_payload',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'result_payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}

