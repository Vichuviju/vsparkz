<?php

namespace App\Services\Integrations;

use App\Services\IntegrationManager;

class WhatsAppAdapter
{
    public function __construct(
        protected IntegrationManager $integrationManager
    ) {}

    public function getSlug(): string
    {
        return 'whatsapp_cloud';
    }

    public function isConfigured(?int $tenantId = null): bool
    {
        $integration = $this->integrationManager->findBySlug($this->getSlug(), $tenantId);
        if (!$integration) {
            return false;
        }
        $creds = $this->integrationManager->getCredentials($integration);
        return !empty($creds['access_token'] ?? null) && !empty($creds['phone_number_id'] ?? null);
    }

    /**
     * Send a text message via WhatsApp Cloud API (stub).
     */
    public function sendMessage(string $to, string $body, array $options = []): array
    {
        $integration = $this->integrationManager->findBySlug($this->getSlug());
        if (!$integration) {
            throw new \RuntimeException('WhatsApp integration not configured');
        }
        $start = microtime(true);
        $correlationId = uniqid('wa_', true);
        try {
            $creds = $this->integrationManager->getCredentials($integration);
            if (empty($creds['access_token'] ?? null)) {
                throw new \RuntimeException('WhatsApp access token missing');
            }
            $this->integrationManager->log(
                $integration,
                'outbound',
                'success',
                'Send message stub (implement WhatsApp Cloud API)',
                ['to' => $to, 'body_length' => strlen($body)],
                $correlationId,
                (int) ((microtime(true) - $start) * 1000)
            );
            return ['message_id' => 'stub_' . $correlationId];
        } catch (\Throwable $e) {
            $this->integrationManager->log(
                $integration,
                'outbound',
                'failed',
                $e->getMessage(),
                ['to' => $to],
                $correlationId,
                (int) ((microtime(true) - $start) * 1000)
            );
            throw $e;
        }
    }
}
