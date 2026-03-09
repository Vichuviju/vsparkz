<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $agencies = Agency::all();
        if ($agencies->isEmpty()) {
            return;
        }
        $names = [
            ['company_name' => 'Acme Corp', 'contact_name' => 'John Doe'],
            ['company_name' => 'TechStart Inc', 'contact_name' => 'Jane Smith'],
            ['company_name' => 'Global Solutions', 'contact_name' => 'Bob Wilson'],
        ];
        foreach ($agencies as $agency) {
            foreach ($names as $idx => $n) {
                $companyName = $n['company_name'] . ' - ' . $agency->slug;
                Client::updateOrCreate(
                    ['tenant_id' => $agency->id, 'company_name' => $companyName],
                    [
                        'contact_name' => $n['contact_name'],
                        'email' => 'client' . $agency->id . $idx . '@example.com',
                        'phone' => '+919876543210',
                        'source' => 'manual',
                    ]
                );
            }
        }
    }
}
