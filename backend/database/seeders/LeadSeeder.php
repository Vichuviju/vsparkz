<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Lead;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        $agencies = Agency::all();
        $seo = Service::where('slug', 'seo')->first();
        if ($agencies->isEmpty() || ! $seo) {
            return;
        }
        foreach ($agencies as $agency) {
            $agencyUsers = User::where('tenant_id', $agency->id)->pluck('id');
            $assignedTo = $agencyUsers->isNotEmpty() ? $agencyUsers->first() : null;
            for ($i = 1; $i <= 4; $i++) {
                Lead::updateOrCreate(
                    ['email' => 'lead-' . $agency->id . '-' . $i . '@example.com'],
                    [
                        'agency_id' => $agency->id,
                        'name' => 'Lead ' . $i,
                        'phone' => '+91123456780',
                        'company' => 'Company ' . $i,
                        'service_id' => $seo->id,
                        'status' => 'new',
                        'source' => 'website',
                        'assigned_to' => $assignedTo,
                    ]
                );
            }
        }
    }
}
