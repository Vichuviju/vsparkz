<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Invoice;
use Illuminate\Database\Seeder;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $clients = Client::limit(4)->get();
        if ($clients->isEmpty()) {
            return;
        }
        $statuses = ['draft', 'sent', 'paid'];
        $num = 1;
        foreach ($clients as $idx => $client) {
            $number = 'INV-' . $num++;
            Invoice::updateOrCreate(
                ['number' => $number],
                [
                    'client_id' => $client->id,
                    'items' => [],
                    'subtotal' => 15000,
                    'tax_rate' => 18,
                    'tax_amount' => 2700,
                    'total' => 17700,
                    'status' => $statuses[$idx % 3],
                    'due_date' => now()->addDays(15),
                ]
            );
        }
    }
}
