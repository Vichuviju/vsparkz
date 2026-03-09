<?php

namespace App\Services;

use App\Jobs\PublishPostJob;
use App\Models\Post;

class SocialPlannerService
{
    public function createPost(array $data, $tenantId = null): Post
    {
        $data['tenant_id'] = $tenantId ?: auth()->user()?->tenant_id;
        return Post::create($data);
    }

    public function schedulePost(Post $post, $scheduledAt = null): Post
    {
        $post->update(['scheduled_at' => $scheduledAt ?: $post->scheduled_at, 'status' => 'scheduled']);
        if ($post->scheduled_at) {
            PublishPostJob::dispatch($post)->delay($post->scheduled_at);
        }
        return $post->fresh();
    }
}
