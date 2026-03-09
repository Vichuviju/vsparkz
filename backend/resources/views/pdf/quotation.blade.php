<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation {{ $quotation->number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        .meta { margin-bottom: 16px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; }
        .totals { margin-top: 12px; text-align: right; }
    </style>
</head>
<body>
    <h1>Quotation {{ $quotation->number }}</h1>
    @if($quotation->title)<p><strong>{{ $quotation->title }}</strong></p>@endif
    <div class="meta">
        Client: {{ $quotation->client->company_name ?? '—' }}<br>
        Valid until: {{ $quotation->valid_until ? $quotation->valid_until->format('d M Y') : '—' }}<br>
        Status: {{ $quotation->status }}
    </div>
    <table>
        <thead>
            <tr><th>Description</th><th>Time</th><th>Freelancer</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        </thead>
        <tbody>
            @php
                $services = $quotation->relationLoaded('quotationServices') ? $quotation->quotationServices : collect();
                $items = is_array($quotation->items) ? $quotation->items : [];
            @endphp
            @if($services->isNotEmpty())
                @foreach($services as $line)
                <tr>
                    <td>{{ $line->subService?->name ?? '—' }}{!! $line->service_flow ? ' <br><small>' . e($line->service_flow) . '</small>' : '' !!}</td>
                    <td>{{ ucfirst($line->time_period ?? '—') }}</td>
                    <td>{{ $line->freelancer->name ?? '—' }}</td>
                    <td>{{ $line->quantity ?? 1 }}</td>
                    <td>{{ number_format($line->unit_price ?? 0, 2) }}</td>
                    <td>{{ number_format($line->amount ?? 0, 2) }}</td>
                </tr>
                @endforeach
            @else
                @foreach($items as $row)
                <tr>
                    <td>{{ $row['description'] ?? $row['name'] ?? '—' }}</td>
                    <td>—</td><td>—</td>
                    <td>{{ $row['quantity'] ?? 1 }}</td>
                    <td>{{ isset($row['rate']) ? number_format($row['rate'], 2) : '—' }}</td>
                    <td>{{ isset($row['amount']) ? number_format($row['amount'], 2) : '—' }}</td>
                </tr>
                @endforeach
            @endif
            @if($services->isEmpty() && empty($items))
            <tr><td colspan="6">No line items.</td></tr>
            @endif
        </tbody>
    </table>
    <div class="totals">
        Subtotal: {{ number_format($quotation->subtotal ?? 0, 2) }}<br>
        Tax ({{ $quotation->tax_rate ?? 0 }}%): {{ number_format($quotation->tax_amount ?? 0, 2) }}<br>
        <strong>Total: {{ number_format($quotation->total ?? 0, 2) }}</strong>
    </div>
    <p style="margin-top: 16px;">Generated: {{ now()->format('d M Y') }}</p>
</body>
</html>
