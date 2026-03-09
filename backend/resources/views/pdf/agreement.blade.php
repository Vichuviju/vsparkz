<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Agreement {{ $agreement->title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        .meta { margin-bottom: 16px; color: #666; }
        .section { margin-top: 12px; }
        .section-title { font-weight: bold; margin-bottom: 4px; }
    </style>
</head>
<body>
    <h1>{{ $agreement->title }}</h1>
    <div class="meta">
        Client: {{ $agreement->client->company_name ?? '—' }}<br>
        @if($agreement->project)
        Project: {{ $agreement->project->name }}<br>
        @endif
        Status: {{ $agreement->status }}<br>
        @if($agreement->signed_at)
        Signed at: {{ $agreement->signed_at->format('d M Y H:i') }}<br>
        @endif
    </div>
    @if($agreement->scope)
    <div class="section">
        <div class="section-title">Scope</div>
        <div>{{ nl2br(e($agreement->scope)) }}</div>
    </div>
    @endif
    @if($agreement->timeline)
    <div class="section">
        <div class="section-title">Timeline</div>
        <div>{{ $agreement->timeline }}</div>
    </div>
    @endif
    @if($agreement->payment_terms)
    <div class="section">
        <div class="section-title">Payment terms</div>
        <div>{{ nl2br(e($agreement->payment_terms)) }}</div>
    </div>
    @endif
    @php $quotation = $agreement->relationLoaded('quotation') ? $agreement->quotation : null; @endphp
    @if($quotation && $quotation->relationLoaded('quotationServices') && $quotation->quotationServices->isNotEmpty())
    <div class="section" style="margin-top: 16px;">
        <div class="section-title">Services (from Quotation {{ $quotation->number }})</div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
            <tr style="background: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Service</th><th style="border: 1px solid #ddd; padding: 6px;">Period</th><th style="border: 1px solid #ddd; padding: 6px;">Freelancer</th><th style="border: 1px solid #ddd; padding: 6px;">Qty</th><th style="border: 1px solid #ddd; padding: 6px;">Amount</th></tr>
            @foreach($quotation->quotationServices as $line)
            <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">{{ $line->subService?->name ?? '—' }}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">{{ ucfirst($line->time_period ?? '—') }}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">{{ $line->freelancer?->name ?? '—' }}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">{{ $line->quantity ?? 1 }}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">{{ number_format($line->amount ?? 0, 2) }}</td>
            </tr>
            @endforeach
        </table>
        <p style="margin-top: 8px;"><strong>Total: {{ number_format($quotation->total ?? 0, 2) }}</strong></p>
    </div>
    @endif
    <p style="margin-top: 20px; color: #666;">Generated: {{ now()->format('d M Y') }}</p>
</body>
</html>
