<?php

namespace Database\Seeders;

use App\Models\ComboPackage;
use App\Models\ComboPackageItem;
use App\Models\SubService;
use Illuminate\Database\Seeder;

class ComboPackageSeeder extends Seeder
{
    public function run(): void
    {
        $subServices = SubService::with('service')->orderBy('service_id')->orderBy('sort_order')->get();
        if ($subServices->isEmpty()) {
            return;
        }

        $starter = ComboPackage::updateOrCreate(
            ['name' => 'Starter'],
            [
                'tagline' => 'Most Economical',
                'short_description' => 'Ideal for small businesses getting started with digital marketing.',
                'display_order' => 1,
                'discount_type' => 'percent',
                'discount_value' => 10,
                'is_active' => true,
            ]
        );
        ComboPackageItem::where('combo_package_id', $starter->id)->delete();
        foreach ($subServices->take(4) as $ss) {
            ComboPackageItem::create([
                'combo_package_id' => $starter->id,
                'service_id' => $ss->service_id,
                'sub_service_id' => $ss->id,
                'pricing_level_id' => null,
                'quantity' => 1,
            ]);
        }

        $accelerator = ComboPackage::updateOrCreate(
            ['name' => 'Accelerator'],
            [
                'tagline' => 'The Growth Package',
                'short_description' => 'More reach and frequency for growing brands.',
                'display_order' => 2,
                'discount_type' => 'percent',
                'discount_value' => 15,
                'is_active' => true,
            ]
        );
        ComboPackageItem::where('combo_package_id', $accelerator->id)->delete();
        foreach ($subServices as $ss) {
            ComboPackageItem::create([
                'combo_package_id' => $accelerator->id,
                'service_id' => $ss->service_id,
                'sub_service_id' => $ss->id,
                'pricing_level_id' => null,
                'quantity' => 1,
            ]);
        }
    }
}
