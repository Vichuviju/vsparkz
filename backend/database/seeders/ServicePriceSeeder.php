<?php

namespace Database\Seeders;

use App\Models\PricingLevel;
use App\Models\Service;
use App\Models\ServicePrice;
use App\Models\SubService;
use Illuminate\Database\Seeder;

class ServicePriceSeeder extends Seeder
{
    public function run(): void
    {
        $basic = PricingLevel::where('slug', 'basic')->first();
        $advanced = PricingLevel::where('slug', 'advanced')->first();
        $seo = Service::where('slug', 'seo')->first();
        $social = Service::where('slug', 'social-media')->first();
        if (! $basic || ! $seo) {
            return;
        }
        $prices = [
            ['service_id' => $seo->id, 'sub_service_id' => null, 'pricing_level_id' => $basic->id, 'amount' => 5000, 'duration_value' => 30, 'duration_unit' => 'days'],
            ['service_id' => $seo->id, 'sub_service_id' => null, 'pricing_level_id' => $advanced?->id ?? $basic->id, 'amount' => 15000, 'duration_value' => 30, 'duration_unit' => 'days'],
            ['service_id' => $social?->id ?? $seo->id, 'sub_service_id' => null, 'pricing_level_id' => $basic->id, 'amount' => 8000, 'duration_value' => 30, 'duration_unit' => 'days'],
        ];
        $keywordResearch = SubService::where('service_id', $seo->id)->where('name', 'Keyword Research')->first();
        if ($keywordResearch) {
            $prices[] = ['service_id' => $seo->id, 'sub_service_id' => $keywordResearch->id, 'pricing_level_id' => $basic->id, 'amount' => 2000, 'duration_value' => 14, 'duration_unit' => 'days'];
        }
        $contentCreation = $social ? SubService::where('service_id', $social->id)->where('name', 'Content Creation')->first() : null;
        if ($contentCreation) {
            $prices[] = ['service_id' => $social->id, 'sub_service_id' => $contentCreation->id, 'pricing_level_id' => $basic->id, 'amount' => 4000, 'duration_value' => 10, 'duration_unit' => 'posts'];
        }
        foreach ($prices as $p) {
            ServicePrice::updateOrCreate(
                [
                    'service_id' => $p['service_id'],
                    'sub_service_id' => $p['sub_service_id'] ?? null,
                    'pricing_level_id' => $p['pricing_level_id'],
                ],
                array_merge($p, ['duration_value' => $p['duration_value'] ?? 30, 'duration_unit' => $p['duration_unit'] ?? 'days'])
            );
        }
    }
}
