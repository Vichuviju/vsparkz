<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Strategy Report - {{ $strategyReport->id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; line-height: 1.4; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        .meta { color: #666; margin-bottom: 16px; }
        .content { white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>Strategy Report</h1>
    <div class="meta">
        Client: {{ $strategyReport->client->company_name ?? '—' }}<br>
        Project: {{ $strategyReport->project->name ?? '—' }}<br>
        Version: {{ $strategyReport->version ?? 1 }} | Status: {{ $strategyReport->status }}<br>
        @if($strategyReport->estimated_budget) Estimated budget: {{ number_format($strategyReport->estimated_budget, 2) }}<br>@endif
        Generated: {{ now()->format('d M Y') }}
    </div>
    <div class="content">{{ $strategyReport->content ?? 'No content.' }}</div>
</body>
</html>
