<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $offerDocument->name }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; margin: 0; }
        .container { display: table; width: 100%; }
        .sidebar { display: table-cell; width: 28%; vertical-align: top; padding: 16px; background: #2d2a4a; color: #fff; }
        .sidebar .company { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
        .sidebar .tagline { font-size: 9px; color: #c9b8e8; margin-bottom: 12px; }
        .sidebar .pricing-title { font-size: 18px; font-weight: bold; color: #e91e8c; margin-bottom: 12px; }
        .sidebar ul { list-style: none; padding: 0; margin: 0 0 12px 0; }
        .sidebar li { padding: 4px 0; font-size: 10px; }
        .main { display: table-cell; width: 72%; vertical-align: top; padding: 12px; }
        .columns { display: table; width: 100%; border-collapse: separate; border-spacing: 8px; }
        .col { display: table-cell; width: 33.33%; vertical-align: top; padding: 12px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; }
        .col h3 { margin: 0 0 8px 0; font-size: 14px; }
        .limited-badge { background: #e91e8c; color: #fff; font-size: 9px; padding: 4px 8px; margin-bottom: 8px; display: inline-block; border-radius: 2px; }
        .price { font-size: 18px; font-weight: bold; margin: 8px 0 2px 0; }
        .price-unit { font-size: 10px; color: #e91e8c; margin-bottom: 8px; }
        .col ul { list-style: none; padding: 0; margin: 0 0 8px 0; font-size: 10px; }
        .col li { padding: 2px 0; border-bottom: 1px solid #eee; }
        .col .tagline { font-size: 10px; font-weight: bold; margin-top: 8px; color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            @if($offerDocument->company_name)<div class="company">{{ $offerDocument->company_name }}</div>@endif
            @if($offerDocument->tagline)<div class="tagline">{{ $offerDocument->tagline }}</div>@endif
            <div class="pricing-title">{{ $offerDocument->pricing_title ?: 'PRICING' }}</div>
            @if(!empty($offerDocument->sidebar_features))
                <ul>
                    @foreach($offerDocument->sidebar_features as $f)
                        <li>{{ $f }}</li>
                    @endforeach
                </ul>
            @endif
            @if($offerDocument->payment_note)<p style="font-size: 9px; margin: 12px 0 0 0;">{{ $offerDocument->payment_note }}</p>@endif
        </div>
        <div class="main">
            <div class="columns">
                @foreach($offerDocument->comboPackages as $index => $combo)
                    @php $totals = $combo->getComputedTotals(); @endphp
                    <div class="col">
                        @if($index === 0 && $offerDocument->limited_offer_text)
                            <div class="limited-badge">{{ $offerDocument->limited_offer_text }}</div>
                        @endif
                        <h3>{{ $combo->name }}</h3>
                        <div class="price">₹{{ number_format($totals['total'], 0) }}</div>
                        <div class="price-unit">/Month</div>
                        @if(!empty($totals['total_duration']))
                            <div style="font-size: 10px; margin-bottom: 6px;">
                                @foreach($totals['total_duration'] as $unit => $val)
                                    {{ $val }} {{ $unit }}@if(!$loop->last), @endif
                                @endforeach
                                monthly
                            </div>
                        @endif
                        <ul>
                            @foreach($combo->items as $item)
                                <li>{{ $item->subService ? $item->subService->name : (optional($item->service)->title ?? '—') }}</li>
                            @endforeach
                        </ul>
                        @if($combo->tagline)<div class="tagline">{{ $combo->tagline }}</div>@endif
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</body>
</html>
