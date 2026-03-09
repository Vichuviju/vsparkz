<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppMessage extends Model
{
    protected $fillable = [
        'whatsapp_conversation_id', 'direction', 'message_type', 'body', 'media_json',
        'provider_message_id', 'sent_at', 'status',
    ];

    protected $casts = [
        'media_json' => 'array',
        'sent_at' => 'datetime',
    ];

    public function whatsappConversation(): BelongsTo
    {
        return $this->belongsTo(WhatsAppConversation::class);
    }
}
