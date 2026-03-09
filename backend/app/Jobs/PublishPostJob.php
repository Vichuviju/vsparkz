<?php

namespace App\Jobs;

use App\Models\Post;
use App\Services\Integrations\MetaAdapter;
use App\Services\Integrations\LinkedInAdapter;
use App\Services\Integrations\GoogleBusinessAdapter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PublishPostJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $postId) {}

    public function handle(): void
    {
        $post = Post::find($this->postId);
        if (!$post || $post->status === 'published') {
            return;
        }
        $account = $post->socialAccount;
        if (!$account) {
            $post->update(['status' => 'failed', 'error_message' => 'No social account']);
            return;
        }
        $platform = strtolower($account->platform ?? '');
        $adapter = match ($platform) {
            'facebook', 'instagram', 'meta' => app(MetaAdapter::class),
            'linkedin' => app(LinkedInAdapter::class),
            'google_business' => app(GoogleBusinessAdapter::class),
            default => null,
        };
        if (!$adapter || !$adapter->canPublish()) {
            $post->update(['status' => 'failed', 'error_message' => 'Adapter not configured']);
            return;
        }
        try {
            $payload = ['content' => $post->content_json];
            $result = $adapter->publish($payload);
            $post->update([
                'status' => 'published',
                'published_at' => now(),
                'external_id' => $result['external_id'] ?? null,
                'error_message' => null,
            ]);
        } catch (\Throwable $e) {
            $post->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            throw $e;
        }
    }
}
