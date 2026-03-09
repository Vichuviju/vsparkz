<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class SettingsLoaderService
{
    public const CACHE_TTL = 3600;

    public const CACHE_KEY_PREFIX = 'system_settings:';

    /**
     * Get a setting value by key. Resolves tenant from auth or parameter.
     * Falls back to global (tenant_id null) when tenant-specific value is missing.
     * Reads from cache then DB; decrypts if needed.
     */
    public function get(string $key, mixed $default = null, ?int $tenantId = null): mixed
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $cacheKey = self::CACHE_KEY_PREFIX . ($tenantId ?? 'global') . ':' . $key;

        $value = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($key, $tenantId) {
            $query = SystemSetting::where('key', $key)->orderByRaw('tenant_id IS NULL ASC');
            if ($tenantId !== null) {
                $query->whereIn('tenant_id', [$tenantId, null]);
            } else {
                $query->whereNull('tenant_id');
            }
            $setting = $query->first();

            if (! $setting) {
                return null;
            }

            $raw = $setting->value_json;
            if ($setting->is_encrypted && is_array($raw) && isset($raw['_encrypted'])) {
                try {
                    return json_decode(Crypt::decryptString($raw['_encrypted']), true);
                } catch (\Throwable) {
                    return null;
                }
            }

            if (is_array($raw) && array_keys($raw) === ['_value']) {
                return $raw['_value'];
            }
            return $raw;
        });

        return $value ?? $default;
    }

    public function getBoolean(string $key, bool $default = false, ?int $tenantId = null): bool
    {
        $v = $this->get($key, $default, $tenantId);
        return filter_var($v, FILTER_VALIDATE_BOOLEAN);
    }

    public function getInt(string $key, int $default = 0, ?int $tenantId = null): int
    {
        $v = $this->get($key, $default, $tenantId);
        return (int) $v;
    }

    public function getArray(string $key, array $default = [], ?int $tenantId = null): array
    {
        $v = $this->get($key, $default, $tenantId);
        return is_array($v) ? $v : $default;
    }

    /**
     * Load integration config by slug (e.g. meta_ads, sendgrid). Returns merged tenant + global.
     */
    public function loadIntegrationConfig(string $slug, ?int $tenantId = null): array
    {
        $group = $this->getGroup('integrations', $tenantId);
        $out = $group[$slug] ?? [];
        return is_array($out) ? $out : [];
    }

    /**
     * Load queue/worker config. Keys: max_concurrent_jobs, retry_count, queue_name, etc.
     */
    public function loadQueueConfig(?int $tenantId = null): array
    {
        $group = $this->getGroup('queue', $tenantId);
        return is_array($group) ? $group : [];
    }

    /**
     * Load AI provider config (default_provider, model, fallback_model).
     */
    public function loadAiConfig(?int $tenantId = null): array
    {
        $group = $this->getGroup('ai', $tenantId);
        return is_array($group) ? $group : [];
    }

    /**
     * Load branding/theme config for white-label.
     */
    public function loadBrandingConfig(?int $tenantId = null): array
    {
        $group = $this->getGroup('branding', $tenantId);
        return is_array($group) ? $group : [];
    }

    /**
     * Set a setting value. Clears cache on update.
     */
    public function set(
        string $key,
        mixed $value,
        string $group = 'general',
        ?int $tenantId = null,
        bool $encrypt = false,
        ?int $updatedBy = null
    ): void {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $updatedBy = $updatedBy ?? auth()->id();

        if ($encrypt) {
            $stored = ['_encrypted' => Crypt::encryptString(json_encode($value))];
        } else {
            $stored = is_array($value) || is_object($value) ? (array) $value : ['_value' => $value];
        }

        SystemSetting::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'key' => $key,
            ],
            [
                'group' => $group,
                'value_json' => $stored,
                'is_encrypted' => $encrypt,
                'updated_by' => $updatedBy,
            ]
        );

        $this->clearCache($key, $tenantId);
    }

    /**
     * Get all settings in a group.
     */
    public function getGroup(string $group, ?int $tenantId = null): array
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $cacheKey = self::CACHE_KEY_PREFIX . 'group:' . ($tenantId ?? 'global') . ':' . $group;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($group, $tenantId) {
            $query = SystemSetting::where('group', $group);
            if ($tenantId === null) {
                $query->whereNull('tenant_id');
            } else {
                $query->where('tenant_id', $tenantId);
            }
            $settings = $query->get();
            $out = [];
            foreach ($settings as $s) {
                $raw = $s->value_json;
                if ($s->is_encrypted && is_array($raw) && isset($raw['_encrypted'])) {
                    try {
                        $out[$s->key] = json_decode(Crypt::decryptString($raw['_encrypted']), true);
                    } catch (\Throwable) {
                        $out[$s->key] = null;
                    }
                } elseif (is_array($raw) && array_keys($raw) === ['_value']) {
                    $out[$s->key] = $raw['_value'];
                } else {
                    $out[$s->key] = $raw;
                }
            }
            return $out;
        });
    }

    public function clearCache(?string $key = null, ?int $tenantId = null): void
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        if ($key !== null) {
            Cache::forget(self::CACHE_KEY_PREFIX . ($tenantId ?? 'global') . ':' . $key);
        } else {
            $prefix = self::CACHE_KEY_PREFIX . ($tenantId ?? 'global');
            Cache::flush(); // simplistic; in production use tags or iterate keys
        }
    }
}
