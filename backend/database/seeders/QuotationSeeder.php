<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Quotation;
use Illuminate\Database\Seeder;

class QuotationSeeder extends Seeder
{
    public function run(): void
    {
        $clients = Client::limit(4)->get();
        if ($clients->isEmpty()) {
            return;
        }
        $n = 1;
        foreach ($clients as $client) {
            Quotation::updateOrCreate(
                ['number' => 'QUO-' . $n],
                [
                    'client_id' => $client->id,
                    'title' => 'SEO Package',
                    'subtotal' => 13000,
                    'tax_rate' => 18,
                    'tax_amount' => 2340,
                    'total' => 15340,
                    'status' => 'draft',
                ]
            );
            $n++;
        }
    }
}
