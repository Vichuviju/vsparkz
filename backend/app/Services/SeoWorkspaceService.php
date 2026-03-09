<?php

namespace App\Services;

use App\Models\Keyword;
use App\Models\Ranking;
use App\Models\Competitor;
use App\Models\SiteAudit;
use App\Models\Backlink;

class SeoWorkspaceService
{
    public function listKeywords(?int $tenantId = null, ?int $clientId = null)
    {
        $tid = $tenantId ?? auth()->user()?->tenant_id;
        $q = Keyword::where('tenant_id', $tid);
        if ($clientId !== null) {
            $q->where('client_id', $clientId);
        }
        return $q->orderBy('keyword')->get();
    }

    public function createKeyword(array $data, ?int $tenantId = null): Keyword
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        return Keyword::create($data);
    }

    public function updateKeyword(Keyword $keyword, array $data): Keyword
    {
        $keyword->update($data);
        return $keyword->fresh();
    }

    public function listRankings(Keyword $keyword)
    {
        return $keyword->rankings()->orderByDesc('captured_at')->get();
    }

    public function listCompetitors(?int $tenantId = null, ?int $clientId = null)
    {
        $tid = $tenantId ?? auth()->user()?->tenant_id;
        $q = Competitor::where('tenant_id', $tid);
        if ($clientId !== null) {
            $q->where('client_id', $clientId);
        }
        return $q->get();
    }

    public function createCompetitor(array $data, ?int $tenantId = null): Competitor
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        return Competitor::create($data);
    }

    public function listSiteAudits(?int $tenantId = null, ?int $clientId = null)
    {
        $tid = $tenantId ?? auth()->user()?->tenant_id;
        $q = SiteAudit::where('tenant_id', $tid);
        if ($clientId !== null) {
            $q->where('client_id', $clientId);
        }
        return $q->orderByDesc('run_at')->get();
    }

    public function createSiteAudit(array $data, ?int $tenantId = null): SiteAudit
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        $data['run_at'] = $data['run_at'] ?? now();
        return SiteAudit::create($data);
    }

    public function listBacklinks(?int $tenantId = null, ?int $clientId = null)
    {
        $tid = $tenantId ?? auth()->user()?->tenant_id;
        $q = Backlink::where('tenant_id', $tid);
        if ($clientId !== null) {
            $q->where('client_id', $clientId);
        }
        return $q->get();
    }

    public function createBacklink(array $data, ?int $tenantId = null): Backlink
    {
        $data['tenant_id'] = $tenantId ?? auth()->user()?->tenant_id;
        return Backlink::create($data);
    }

    /** Fetch rankings for a keyword (stub: optional integration trigger). */
    public function fetchRankingsForKeyword(Keyword $keyword, ?int $tenantId = null): void
    {
        $tenantId = $tenantId ?? $keyword->tenant_id;
        // Stub: would call SEO integration and persist Ranking records
        Ranking::create([
            'tenant_id' => $tenantId,
            'keyword_id' => $keyword->id,
            'search_engine' => 'google',
            'captured_at' => now(),
        ]);
    }

    /** Run site audit for a given audit record (stub: optional integration). */
    public function runSiteAudit(SiteAudit $audit, ?int $tenantId = null): SiteAudit
    {
        $audit->update([
            'run_at' => now(),
            'score' => $audit->score ?? 0,
            'audit_type' => $audit->audit_type ?? 'general',
        ]);
        return $audit->fresh();
    }
}
