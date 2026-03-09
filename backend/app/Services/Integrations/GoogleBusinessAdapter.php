<?php

namespace App\Services\Integrations;

use App\Services\IntegrationManager;
use App\Services\Integrations\Contracts\ChannelAdapterInterface;

class GoogleBusinessAdapter implements ChannelAdapterInterface
{
    public function __construct(protected IntegrationManager $integrationManager) {}

    public function getSlug(): string
    {
        return 'google_business';
    }

    public function canPublish(): bool
    {
        $i = $this->integrationManager->findBySlug($this->getSlug());
        return $i && !empty($this->integrationManager->getCredentials($i)['access_token'] ?? null);
    }

    public function publish(array $payload): array
    {
        $i = $this->integrationManager->findBySlug($this->getSlug());
        if (!$i) {
            throw new \RuntimeException('Google Business integration not configured');
        }
        $t0 = microtime(true);
        $cid = uniqid('gb_', true);
        $this->integrationManager->log($i, 'outbound', 'success', 'Publish stub', $payload, $cid, (int)((microtime(true) - $t0) * 1000));
        return ['external_id' => 'stub_' . $cid];
    }
}
