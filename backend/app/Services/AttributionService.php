<?php

namespace App\Services;

use App\Models\UtmEvent;
use App\Models\FunnelEvent;
use App\Models\FunnelStage;
use App\Models\ChannelAttributionSnapshot;

class AttributionService
{
    public function recordUtmEvent(array $data, ?int $tenantId = null): UtmEvent
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        $data['occurred_at'] = $data['occurred_at'] ?? now();
        return UtmEvent::create($data);
    }

    public function recordFunnelEvent(array $data, ?int $tenantId = null): FunnelEvent
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        $data['occurred_at'] = $data['occurred_at'] ?? now();
        return FunnelEvent::create($data);
    }

    public function listFunnelStages(?int $tenantId = null)
    {
        $tid = $tenantId ?? auth()->user()?->tenant_id;
        return FunnelStage::where('tenant_id', $tid)->orderBy('order')->get();
    }

    public function createChannelAttributionSnapshot(array $data, ?int $tenantId = null): ChannelAttributionSnapshot
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        return ChannelAttributionSnapshot::create($data);
    }

    public function listChannelSnapshots(?int $tenantId = null, ?string $channel = null)
    {
        $tid = $tenantId ?? auth()->user()?->tenant_id;
        $q = ChannelAttributionSnapshot::where('tenant_id', $tid);
        if ($channel !== null) {
            $q->where('channel', $channel);
        }
        return $q->orderByDesc('period_end')->get();
    }
}
