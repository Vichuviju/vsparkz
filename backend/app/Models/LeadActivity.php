<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadActivity extends Model
{
    protected $fillable = ['lead_id', 'user_id', 'type', 'content'];

    public const TYPE_CALL = 'call';
    public const TYPE_COMMENT = 'comment';
    public const TYPE_EMAIL = 'email';

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
