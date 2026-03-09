<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\SubService;
use Illuminate\Database\Seeder;

class SubServiceSeeder extends Seeder
{
    public function run(): void
    {
        $seo = Service::where('slug', 'seo')->first();
        $social = Service::where('slug', 'social-media')->first();
        if (! $seo || ! $social) {
            return;
        }
        $items = [
            ['service_id' => $seo->id, 'name' => 'Keyword Research', 'description' => 'Research and target relevant keywords for your niche.', 'average_price' => 2000, 'average_duration_value' => 14, 'average_duration_unit' => 'days', 'service_type' => 'one-time', 'sort_order' => 1],
            ['service_id' => $seo->id, 'name' => 'On-Page SEO', 'description' => 'Optimize page content and meta for search engines.', 'average_price' => 3000, 'average_duration_value' => 21, 'average_duration_unit' => 'days', 'service_type' => 'one-time', 'sort_order' => 2],
            ['service_id' => $seo->id, 'name' => 'Technical SEO', 'description' => 'Site speed, structure, and crawlability improvements.', 'average_price' => 5000, 'average_duration_value' => 30, 'average_duration_unit' => 'days', 'service_type' => 'one-time', 'sort_order' => 3],
            ['service_id' => $social->id, 'name' => 'Content Creation', 'description' => 'Monthly content and creatives for social channels.', 'average_price' => 4000, 'average_duration_value' => 10, 'average_duration_unit' => 'posts', 'service_type' => 'recurring', 'sort_order' => 1],
            ['service_id' => $social->id, 'name' => 'Community Management', 'description' => 'Engagement and community moderation.', 'average_price' => 3000, 'average_duration_value' => 30, 'average_duration_unit' => 'days', 'service_type' => 'recurring', 'sort_order' => 2],
        ];
        foreach ($items as $i) {
            SubService::updateOrCreate(
                ['service_id' => $i['service_id'], 'name' => $i['name']],
                array_merge($i, ['is_active' => true])
            );
        }
    }
}
