<?php

namespace App\Services;

use App\Models\AiRequest;
use App\Models\AiTemplate;
use App\Models\AiUsage;
use App\Services\IntegrationManager;
use App\Services\SettingsLoaderService;

class AiGatewayService
{
    public function __construct(
        protected SettingsLoaderService $settings,
        protected IntegrationManager $integrations
    ) {}

    public function getConfig(?int $tenantId = null): array
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        return $this->settings->loadAiConfig($tenantId);
    }

    public function findTemplate(?int $id, ?string $useCase = null, ?int $tenantId = null): ?AiTemplate
    {
        if ($id) {
            return AiTemplate::find($id);
        }
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        return AiTemplate::where('tenant_id', $tenantId)->where('use_case', $useCase)->first();
    }

    public function execute(int $tenantId, ?int $templateId, array $input, ?string $provider = null, ?string $model = null): AiRequest
    {
        $template = $templateId ? AiTemplate::find($templateId) : null;
        $provider = $provider ?? $template?->default_provider ?? $this->getConfig($tenantId)['provider'] ?? null;
        $model = $model ?? $template?->default_model ?? $this->getConfig($tenantId)['model'] ?? null;
        $request = AiRequest::create([
            'tenant_id' => $tenantId,
            'ai_template_id' => $template?->id,
            'provider' => $provider,
            'model' => $model,
            'input_json' => $input,
            'status' => 'pending',
            'requested_by' => auth()->id(),
            'requested_at' => now(),
        ]);
        try {
            $adapter = $this->integrations->getAiAdapter($provider);
            $start = microtime(true);
            $payload = array_merge($input, ['model' => $model]);
            $output = $adapter ? $adapter->complete($payload) : ['stub' => true];
            $request->update([
                'output_json' => $output,
                'status' => 'completed',
                'latency_ms' => (int) ((microtime(true) - $start) * 1000),
            ]);
            $this->recordUsage($tenantId, $provider, $model, $output['tokens_in'] ?? 0, $output['tokens_out'] ?? 0);
        } catch (\Throwable $e) {
            $request->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
        return $request->fresh();
    }

    public function recordUsage(int $tenantId, string $provider, string $model, int $tokensIn, int $tokensOut): AiUsage
    {
        $period = now()->startOfMonth();
        return AiUsage::create([
            'tenant_id' => $tenantId,
            'provider' => $provider,
            'model' => $model,
            'tokens_in' => $tokensIn,
            'tokens_out' => $tokensOut,
            'period_start' => $period,
            'period_end' => $period->copy()->endOfMonth(),
        ]);
    }
}
