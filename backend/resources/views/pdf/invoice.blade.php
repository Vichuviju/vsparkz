<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->number }}</title>
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
    <h1>Invoice {{ $invoice->number }}</h1>
    <div class="meta">
        Client: {{ $invoice->client->company_name ?? '—' }}<br>
        Due date: {{ $invoice->due_date ? $invoice->due_date->format('d M Y') : '—' }}<br>
        Status: {{ $invoice->status }}
    </div>
    <table>
        <thead>
            <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        </thead>
        <tbody>
            @php $items = is_array($invoice->items) ? $invoice->items : []; @endphp
            @foreach($items as $row)
            <tr>
                <td>{{ $row['description'] ?? $row['name'] ?? '—' }}</td>
                <td>{{ $row['quantity'] ?? 1 }}</td>
                <td>{{ isset($row['rate']) ? number_format($row['rate'], 2) : '—' }}</td>
                <td>{{ isset($row['amount']) ? number_format($row['amount'], 2) : '—' }}</td>
            </tr>
            @endforeach
            @if(empty($items))
            <tr><td colspan="4">No line items.</td></tr>
            @endif
        </tbody>
    </table>
    <div class="totals">
        Subtotal: {{ number_format($invoice->subtotal ?? 0, 2) }}<br>
        Tax ({{ $invoice->tax_rate ?? 0 }}%): {{ number_format($invoice->tax_amount ?? 0, 2) }}<br>
        <strong>Total: {{ number_format($invoice->total ?? 0, 2) }}</strong>
    </div>
    <p style="margin-top: 16px;">Generated: {{ now()->format('d M Y') }}</p>
</body>
</html>
