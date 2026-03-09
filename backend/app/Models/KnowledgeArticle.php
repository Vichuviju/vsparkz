<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeArticle extends Model
{
    protected $fillable = [
        'knowledge_space_id', 'title', 'slug', 'content_markdown', 'status', 'author_id', 'published_at', 'version',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function knowledgeSpace(): BelongsTo
    {
        return $this->belongsTo(KnowledgeSpace::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(KnowledgeArticleVersion::class);
    }
}
