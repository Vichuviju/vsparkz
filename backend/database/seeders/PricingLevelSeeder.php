<?php

namespace Database\Seeders;

use App\Models\PricingLevel;
use Illuminate\Database\Seeder;

class PricingLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['slug' => 'basic', 'label' => 'Basic', 'sort_order' => 1],
            ['slug' => 'intermediate', 'label' => 'Intermediate', 'sort_order' => 2],
            ['slug' => 'advanced', 'label' => 'Advanced', 'sort_order' => 3],
            ['slug' => 'custom', 'label' => 'Custom', 'sort_order' => 4],
        ];
        foreach ($levels as $level) {
            PricingLevel::updateOrCreate(['slug' => $level['slug']], $level);
        }
    }
}
