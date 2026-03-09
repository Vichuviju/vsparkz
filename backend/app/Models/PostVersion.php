<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostVersion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'post_id',
        'content_json',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}

