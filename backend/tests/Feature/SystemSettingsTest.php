<?php

namespace Tests\Feature;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_settings_index_returns_groups_for_authenticated_user(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        SystemSetting::create([
            'tenant_id' => null,
            'group' => 'general',
            'key' => 'app_name',
            'value_json' => ['_value' => 'V-Sparkz'],
            'is_encrypted' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/system-settings?group=general');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertArrayHasKey('group', $data);
        $this->assertArrayHasKey('settings', $data);
    }
}
