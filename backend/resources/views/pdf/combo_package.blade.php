<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $comboPackage->name }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .tagline { font-size: 11px; color: #666; margin-bottom: 8px; }
        .description { margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; }
        .totals { margin-top: 12px; text-align: right; font-weight: bold; }
        .duration { margin-top: 6px; color: #555; }
    </style>
</head>
<body>
    <h1>{{ $comboPackage->name }}</h1>
    @if($comboPackage->tagline)<p class="tagline">{{ $comboPackage->tagline }}</p>@endif
    @if($comboPackage->short_description)<div class="description">{{ $comboPackage->short_description }}</div>@endif
    <p>Discount: {{ $comboPackage->discount_type === 'percent' ? $comboPackage->discount_value . '%' : '₹' . number_format((float)$comboPackage->discount_value, 2) }} ({{ $comboPackage->discount_type }})</p>
    <table>
        <thead>
            <tr><th>Service / Sub-service</th><th>Level</th><th>Qty</th><th>Price</th><th>Duration</th></tr>
        </thead>
        <tbody>
            @foreach($comboPackage->items as $item)
            @php
                $label = $item->subService ? $item->subService->name : (optional($item->service)->title ?? '—');
                $qty = $item->quantity ?? 1;
                $price = null;
                $durVal = null;
                $durUnit = null;
                if ($item->sub_service_id && $item->subService) {
                    $price = $item->subService->average_price ?? null;
                    $durVal = $item->subService->average_duration_value;
                    $durUnit = $item->subService->average_duration_unit;
                }
                if ($price === null && $item->pricing_level_id) {
                    $sp = \App\Models\ServicePrice::where('service_id', $item->service_id)
                        ->where('sub_service_id', $item->sub_service_id)
                        ->where('pricing_level_id', $item->pricing_level_id)->first();
                    if ($sp) {
                        $price = $sp->amount;
                        $durVal = $sp->duration_value;
                        $durUnit = $sp->duration_unit;
                    }
                }
                $lineTotal = $price !== null ? (float)$price * $qty : null;
            @endphp
            <tr>
                <td>{{ $label }}</td>
                <td>{{ optional($item->pricingLevel)->label ?? '—' }}</td>
                <td>{{ $qty }}</td>
                <td>@if($lineTotal !== null)₹{{ number_format($lineTotal, 2) }}@else—@endif</td>
                <td>@if($durVal !== null && $durUnit){{ $durVal }} {{ $durUnit }}@else—@endif</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @if(isset($totals))
    <div class="totals">
        <div>Subtotal: ₹{{ number_format($totals['subtotal'] ?? 0, 2) }}</div>
        <div>Discount: ₹{{ number_format($totals['discount'] ?? 0, 2) }}</div>
        <div>Total: ₹{{ number_format($totals['total'] ?? 0, 2) }}</div>
    </div>
    @if(!empty($totals['total_duration']))
    <div class="duration">Estimated time: @foreach($totals['total_duration'] as $unit => $val){{ $val }} {{ $unit }}@if(!$loop->last), @endif @endforeach</div>
    @endif
    @endif
    <p style="margin-top: 16px; font-size: 10px; color: #888;">Generated: {{ now()->format('d M Y') }}</p>
</body>
</html>
