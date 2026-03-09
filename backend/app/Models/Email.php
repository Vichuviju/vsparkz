<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Email extends Model
{
    use BelongsToTenant;

    protected $table = 'emails';

    protected $fillable = ['tenant_id', 'email_thread_id', 'direction', 'from_email', 'to_emails_json', 'cc_emails_json', 'bcc_emails_json', 'subject', 'body_html', 'body_text', 'provider_message_id', 'received_at', 'sent_at', 'status'];

    protected $casts = ['to_emails_json' => 'array', 'cc_emails_json' => 'array', 'bcc_emails_json' => 'array', 'received_at' => 'datetime', 'sent_at' => 'datetime'];

    public function emailThread(): BelongsTo
    {
        return $this->belongsTo(EmailThread::class);
    }
}
