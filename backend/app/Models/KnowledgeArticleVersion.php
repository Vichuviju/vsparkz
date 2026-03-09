<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeArticleVersion extends Model
{
    protected $fillable = [
        'knowledge_article_id', 'version', 'content_markdown', 'changed_by', 'changed_at', 'change_summary',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function knowledgeArticle(): BelongsTo
    {
        return $this->belongsTo(KnowledgeArticle::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
