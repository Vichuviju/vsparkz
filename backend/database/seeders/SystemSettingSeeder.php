<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Seed default system settings (global, tenant_id null) so GET returns non-empty for each group.
     */
    public function run(): void
    {
        $defaults = [
            'general' => [
                'app_name' => 'V-Sparkz',
                'support_email' => 'support@vsparkz.com',
                'timezone' => 'Asia/Kolkata',
            ],
            'integrations' => [
                'meta_ads' => ['enabled' => false, 'app_id' => '', 'app_secret' => ''],
                'sendgrid' => ['enabled' => false, 'api_key' => ''],
            ],
            'queue' => [
                'default_queue_driver' => 'database',
                'max_concurrent_jobs' => 5,
            ],
            'ai' => [
                'default_provider' => 'openai',
                'model' => 'gpt-4',
            ],
            'branding' => [
                'primary_color' => '#0ea5e9',
                'logo_path' => '/logo/logo1.png',
            ],
        ];

        foreach ($defaults as $group => $keys) {
            foreach ($keys as $key => $value) {
                SystemSetting::updateOrCreate(
                    [
                        'tenant_id' => null,
                        'key' => $key,
                    ],
                    [
                        'group' => $group,
                        'value_json' => is_array($value) ? $value : ['_value' => $value],
                        'is_encrypted' => false,
                    ]
                );
            }
        }
    }
}
