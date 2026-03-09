<?php

namespace App\Services\Integrations;

use App\Services\IntegrationManager;
use App\Services\Integrations\Contracts\ChannelAdapterInterface;

class MetaAdapter implements ChannelAdapterInterface
{
    public function __construct(protected IntegrationManager $integrationManager) {}

    public function getSlug(): string
    {
        return 'meta_ads';
    }

    public function canPublish(): bool
    {
        $i = $this->integrationManager->findBySlug($this->getSlug());
        if (!$i) {
            return false;
        }
        $c = $this->integrationManager->getCredentials($i);
        return !empty($c['access_token'] ?? null);
    }

    public function publish(array $payload): array
    {
        $i = $this->integrationManager->findBySlug($this->getSlug());
        if (!$i) {
            throw new \RuntimeException('Meta integration not configured');
        }
        $cid = uniqid('meta_', true);
        $this->integrationManager->log($i, 'outbound', 'success', 'Publish stub', $payload, $cid, null);
        return ['external_id' => 'stub_' . $cid];
    }
}
