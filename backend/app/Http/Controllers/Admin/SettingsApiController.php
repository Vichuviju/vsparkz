<?php

namespace App\Http\Controllers\Admin;

use App\Services\SettingsLoaderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsApiController extends BaseController
{
    public function __construct(
        protected SettingsLoaderService $settings
    ) {}

    /**
     * GET /admin/system-settings?group=integrations|queue|ai|branding|general
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $group = $request->query('group', 'general');
        $data = $this->settings->getGroup($group, $tenantId);
        return response()->json(['group' => $group, 'settings' => $data]);
    }

    /**
     * GET /admin/system-settings/{key}
     */
    public function show(Request $request, string $key): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $value = $this->settings->get($key, null, $tenantId);
        return response()->json(['key' => $key, 'value' => $value]);
    }

    /**
     * PUT /admin/system-settings
     * Body: { "key": "...", "group": "general", "value": ..., "encrypt": false }
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255',
            'group' => 'nullable|string|max:100',
            'value' => 'nullable',
            'encrypt' => 'boolean',
        ]);
        $tenantId = $this->getTenantId($request);
        $this->settings->set(
            $validated['key'],
            $validated['value'] ?? null,
            $validated['group'] ?? 'general',
            $tenantId,
            $validated['encrypt'] ?? false
        );
        return response()->json(['message' => 'Setting saved']);
    }

    /**
     * GET /admin/system-settings/integration-config/{slug}
     */
    public function integrationConfig(Request $request, string $slug): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $config = $this->settings->loadIntegrationConfig($slug, $tenantId);
        return response()->json(['slug' => $slug, 'config' => $config]);
    }

    /**
     * GET /admin/system-settings/queue-config
     */
    public function queueConfig(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $config = $this->settings->loadQueueConfig($tenantId);
        return response()->json($config);
    }

    /**
     * GET /admin/system-settings/ai-config
     */
    public function aiConfig(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $config = $this->settings->loadAiConfig($tenantId);
        return response()->json($config);
    }

    /**
     * GET /admin/system-settings/branding-config
     */
    public function brandingConfig(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $config = $this->settings->loadBrandingConfig($tenantId);
        return response()->json($config);
    }
}
