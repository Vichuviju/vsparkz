<?php

namespace App\Services;

use App\Models\EmailThread;
use App\Models\Email;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;
use App\Models\CommunicationTag;
use App\Models\CommunicationTaggable;

class CommunicationHubService
{
    public function listEmailThreads($tid = null, $clientId = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        $q = EmailThread::where('tenant_id', $tid);
        if ($clientId !== null) {
            $q->where('client_id', $clientId);
        }
        return $q->orderByDesc('last_message_at')->get();
    }

    public function createEmailThread(array $data, $tid = null): EmailThread
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return EmailThread::create($data);
    }

    public function addEmailToThread(EmailThread $thread, array $data, $tid = null): Email
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        $data['email_thread_id'] = $thread->id;
        $email = Email::create($data);
        $thread->update(['last_message_at' => $email->sent_at ?? $email->received_at ?? now()]);
        return $email;
    }

    public function listWhatsAppConversations($tid = null, $clientId = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        $q = WhatsAppConversation::where('tenant_id', $tid);
        if ($clientId !== null) {
            $q->where('client_id', $clientId);
        }
        return $q->orderByDesc('last_message_at')->get();
    }

    public function createWhatsAppConversation(array $data, $tid = null): WhatsAppConversation
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return WhatsAppConversation::create($data);
    }

    public function addWhatsAppMessage(WhatsAppConversation $conv, array $data): WhatsAppMessage
    {
        $data['whatsapp_conversation_id'] = $conv->id;
        $msg = WhatsAppMessage::create($data);
        $conv->update(['last_message_at' => $msg->sent_at ?? now()]);
        return $msg;
    }

    public function listTags($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return CommunicationTag::where('tenant_id', $tid)->orderBy('name')->get();
    }

    public function createTag(array $data, $tid = null): CommunicationTag
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return CommunicationTag::create($data);
    }

    public function tagEntity(CommunicationTag $tag, string $taggableType, int $taggableId): CommunicationTaggable
    {
        return CommunicationTaggable::firstOrCreate([
            'communication_tag_id' => $tag->id,
            'taggable_type' => $taggableType,
            'taggable_id' => $taggableId,
        ]);
    }
}
