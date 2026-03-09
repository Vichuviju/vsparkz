<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $invoices = Invoice::where('status', 'paid')->limit(2)->get();
        foreach ($invoices as $inv) {
            Payment::updateOrCreate(
                ['invoice_id' => $inv->id, 'gateway_payment_id' => 'pay_' . $inv->id],
                [
                    'amount' => $inv->total,
                    'method' => 'online',
                    'gateway' => 'razorpay',
                    'gateway_status' => 'captured',
                    'paid_at' => now(),
                ]
            );
        }
    }
}
