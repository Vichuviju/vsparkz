<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['title' => 'SEO', 'slug' => 'seo', 'category' => 'marketing', 'service_type' => 'recurring', 'sort_order' => 1],
            ['title' => 'Social Media', 'slug' => 'social-media', 'category' => 'marketing', 'service_type' => 'recurring', 'sort_order' => 2],
            ['title' => 'Paid Ads', 'slug' => 'paid-ads', 'category' => 'marketing', 'service_type' => 'one-time', 'sort_order' => 3],
            ['title' => 'Content Strategy', 'slug' => 'content-strategy', 'category' => 'content', 'service_type' => 'recurring', 'sort_order' => 4],
            ['title' => 'Influencer Marketing', 'slug' => 'influencer-marketing', 'category' => 'marketing', 'service_type' => 'one-time', 'sort_order' => 5],
            ['title' => 'Website Development', 'slug' => 'website-development', 'category' => 'tech', 'service_type' => 'one-time', 'sort_order' => 6],
        ];
        foreach ($services as $s) {
            Service::updateOrCreate(
                ['slug' => $s['slug']],
                array_merge($s, ['description' => null, 'is_active' => true, 'default_duration_value' => 30, 'default_duration_unit' => 'days'])
            );
        }
    }
}
