<?php

namespace App\Services;

use App\Models\Message;
use App\Models\Thread;
use Illuminate\Database\Eloquent\Model;

class CollaborationService
{
    public function createThread(string $subject, Model $threadable, ?int $ownerId = null, ?int $tenantId = null): Thread
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        return Thread::create([
            'tenant_id' => $tenantId,
            'subject' => $subject,
            'owner_id' => $ownerId ?? auth()->id(),
            'threadable_type' => $threadable->getMorphClass(),
            'threadable_id' => $threadable->getKey(),
            'visibility' => 'internal',
        ]);
    }

    public function addMessage(Thread $thread, string $body, ?int $senderId = null): Message
    {
        $senderId = $senderId ?? auth()->id();
        return Message::create([
            'tenant_id' => $thread->tenant_id,
            'thread_id' => $thread->id,
            'sender_id' => $senderId,
            'body' => $body,
            'sent_at' => now(),
        ]);
    }

    public function getThreadsFor(Model $model): \Illuminate\Database\Eloquent\Collection
    {
        return Thread::where('threadable_type', $model->getMorphClass())
            ->where('threadable_id', $model->getKey())
            ->with('messages.sender')
            ->orderByDesc('updated_at')
            ->get();
    }
}
