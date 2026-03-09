<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'thread_id', 'sender_id', 'body', 'attachments_json', 'sent_at'];

    protected $casts = ['attachments_json' => 'array', 'sent_at' => 'datetime'];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
