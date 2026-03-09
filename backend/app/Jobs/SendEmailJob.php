<?php

namespace App\Jobs;

use App\Services\IntegrationManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $to,
        public string $subject,
        public string $body,
        public ?int $identityId = null
    ) {}

    public function handle(IntegrationManager $integrations): void
    {
        $adapter = $integrations->getEmailAdapter();
        if ($adapter) {
            $adapter->send($this->to, $this->subject, $this->body, '', ['identity_id' => $this->identityId]);
        }
    }
}
