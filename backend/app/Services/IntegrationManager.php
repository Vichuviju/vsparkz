<?php

namespace App\Services;

use App\Models\Integration;
use App\Models\IntegrationCredential;
use App\Models\IntegrationLog;
use Illuminate\Support\Facades\Crypt;

class IntegrationManager
{
    public function __construct(
        protected SettingsLoaderService $settings
    ) {}

    /**
     * Get merged config for an integration: system_settings (group=integrations, key=slug) + DB credentials.
     */
    public function getConfig(?int $tenantId, string $slug): array
    {
        $config = $this->settings->loadIntegrationConfig($slug, $tenantId);
        $integration = $this->findBySlug($slug, $tenantId);
        if ($integration) {
            $config['_credentials'] = $this->getCredentials($integration);
        }
        return $config;
    }

    /**
     * Get decrypted credentials for an integration.
     */
    public function getCredentials(int|Integration $integration): array
    {
        $integrationModel = $integration instanceof Integration
            ? $integration
            : Integration::findOrFail($integration);

        /** @var IntegrationCredential[] $creds */
        $creds = $integrationModel->credentials()
            ->orderBy('id')
            ->get();

        $out = [];
        foreach ($creds as $cred) {
            try {
                $out[$cred->key] = json_decode(
                    Crypt::decryptString($cred->value_encrypted),
                    true
                );
            } catch (\Throwable) {
                $out[$cred->key] = null;
            }
        }

        return $out;
    }

    /**
     * Store or update a credential value (encrypted JSON).
     */
    public function setCredential(
        int|Integration $integration,
        string $key,
        mixed $value,
        ?\DateTimeInterface $expiresAt = null
    ): IntegrationCredential {
        $integrationModel = $integration instanceof Integration
            ? $integration
            : Integration::findOrFail($integration);

        $encrypted = Crypt::encryptString(json_encode($value));

        /** @var IntegrationCredential $credential */
        $credential = IntegrationCredential::updateOrCreate(
            [
                'integration_id' => $integrationModel->id,
                'key' => $key,
            ],
            [
                'value_encrypted' => $encrypted,
                'expires_at' => $expiresAt,
            ]
        );

        return $credential;
    }

    /**
     * Log an integration call.
     */
    public function log(
        int|Integration $integration,
        string $direction,
        string $status,
        string $message,
        ?array $payload = null,
        ?string $correlationId = null,
        ?int $latencyMs = null
    ): IntegrationLog {
        $integrationModel = $integration instanceof Integration
            ? $integration
            : Integration::findOrFail($integration);

        return IntegrationLog::create([
            'integration_id' => $integrationModel->id,
            'direction' => $direction,
            'status' => $status,
            'message' => substr($message, 0, 500),
            'payload_json' => $payload,
            'correlation_id' => $correlationId,
            'latency_ms' => $latencyMs,
            'created_at' => now(),
        ]);
    }

    /**
     * Get AI provider adapter by slug (e.g. openai). Returns null if not configured.
     */
    public function getAiAdapter(?string $provider): ?\App\Services\Integrations\Contracts\AiProviderAdapterInterface
    {
        if (! $provider) {
            return null;
        }
        return null;
    }

    /**
     * Get email provider adapter. Returns null if not configured.
     */
    public function getEmailAdapter(): ?\App\Services\Integrations\Contracts\EmailProviderAdapterInterface
    {
        return null;
    }

    /**
     * Helper to resolve an integration by slug for the given or current tenant.
     */
    public function findBySlug(string $slug, ?int $tenantId = null): ?Integration
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;

        return Integration::query()
            ->when($tenantId !== null, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }
}

