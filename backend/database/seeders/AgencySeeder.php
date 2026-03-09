<?php

namespace Database\Seeders;

use App\Models\Agency;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AgencySeeder extends Seeder
{
    public function run(): void
    {
        $agencies = [
            ['name' => 'V-Sparkz HQ', 'slug' => 'vsparkz-hq', 'primary_color' => '#0ea5e9'],
            ['name' => 'Agency Alpha', 'slug' => 'agency-alpha', 'primary_color' => '#8b5cf6'],
        ];
        foreach ($agencies as $a) {
            Agency::updateOrCreate(
                ['slug' => $a['slug']],
                array_merge($a, ['logo_url' => null, 'domain' => null, 'settings' => null])
            );
        }
    }
}
