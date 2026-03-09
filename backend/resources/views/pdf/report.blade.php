<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report - {{ $report->title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; margin: 16px; }
        h1 { font-size: 16px; margin-bottom: 8px; }
        h2 { font-size: 13px; margin: 12px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .meta { color: #666; margin-bottom: 16px; font-size: 10px; }
        .summary { display: table; width: 100%; margin-bottom: 16px; }
        .summary-row { display: table-row; }
        .summary-key { display: table-cell; padding: 4px 12px 4px 0; color: #666; }
        .summary-val { display: table-cell; padding: 4px 0; font-weight: bold; }
        table.data { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 10px; }
        table.data th, table.data td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        table.data th { background: #f5f5f5; font-weight: bold; }
        table.data tr:nth-child(even) { background: #fafafa; }
        .section { margin-bottom: 16px; }
        .section-content { margin: 4px 0; }
        pre.fallback { white-space: pre-wrap; font-size: 9px; background: #f5f5f5; padding: 8px; }
    </style>
</head>
<body>
    <h1>{{ $report->title }}</h1>
    <div class="meta">
        Type: {{ $report->type }} | Reference ID: {{ $report->reference_id ?? '—' }}<br>
        Generated: {{ $report->created_at?->format('d M Y H:i') ?? now()->format('d M Y') }}
    </div>

    @php
        $payload = $report->payload ?? [];
        $payload = is_array($payload) ? $payload : [];
        $sections = $payload['sections'] ?? [];
        $summary = $payload['summary'] ?? null;
        $hasStructured = (!empty($sections) || (!empty($summary) && is_array($summary)));
    @endphp

    @if($summary && is_array($summary))
        <h2>Summary</h2>
        <div class="summary">
            @foreach($summary as $key => $val)
                <div class="summary-row">
                    <div class="summary-key">{{ is_string($key) ? str_replace('_', ' ', $key) : $key }}</div>
                    <div class="summary-val">{{ is_array($val) ? json_encode($val) : $val }}</div>
                </div>
            @endforeach
        </div>
    @endif

    @if(!empty($sections) && is_array($sections))
        @foreach($sections as $section)
            @if(is_array($section))
                <div class="section">
                    @if(!empty($section['title']))
                        <h2>{{ $section['title'] }}</h2>
                    @endif
                    @if(!empty($section['content']))
                        <div class="section-content">{{ $section['content'] }}</div>
                    @endif
                    @if(!empty($section['metrics']) && is_array($section['metrics']))
                        <table class="data">
                            @foreach($section['metrics'] as $k => $v)
                                <tr><td>{{ $k }}</td><td>{{ is_array($v) ? json_encode($v) : $v }}</td></tr>
                            @endforeach
                        </table>
                    @endif
                </div>
            @endif
        @endforeach
    @endif

    @php
        $tables = $payload['tables'] ?? [];
        foreach ($payload as $key => $value) {
            if ($key === 'sections' || $key === 'summary' || $key === 'tables') continue;
            if (is_array($value) && !empty($value) && is_array(reset($value)) === false && is_object(reset($value)) === false) continue;
            if (is_array($value) && !empty($value)) {
                $first = reset($value);
                if (is_array($first) || is_object($first)) {
                    $tables[] = ['title' => str_replace('_', ' ', $key), 'rows' => $value];
                }
            }
        }
    @endphp

    @foreach($tables as $tbl)
        @if(!empty($tbl['rows']) && is_array($tbl['rows']))
            @php
                $rows = $tbl['rows'];
                $first = reset($rows);
                $cols = is_array($first) ? array_keys($first) : (is_object($first) ? array_keys((array)$first) : []);
            @endphp
            @if(!empty($cols))
                @if(!empty($tbl['title']))
                    <h2>{{ $tbl['title'] }}</h2>
                @endif
                <table class="data">
                    <thead>
                        <tr>
                            @foreach($cols as $col)
                                <th>{{ is_string($col) ? str_replace('_', ' ', $col) : $col }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($rows as $row)
                            <tr>
                                @foreach($cols as $col)
                                    <td>{{ is_array($row) ? ($row[$col] ?? '—') : (is_object($row) ? (data_get($row, $col) ?? '—') : '—') }}</td>
                                @endforeach
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        @endif
    @endforeach

    @if(!$hasStructured && empty($tables))
        <pre class="fallback">{{ json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
    @endif
</body>
</html>
