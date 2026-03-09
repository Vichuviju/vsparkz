<?php

namespace App\Services;

use App\Models\TenantBranding;
use App\Models\Domain;
use App\Models\EmailIdentity;

class BrandingService
{
    public function getBrandingForTenant(int $tenantId): array
    {
        $b = TenantBranding::where('tenant_id', $tenantId)->first();
        $d = Domain::where('tenant_id', $tenantId)->orderByDesc('is_primary')->get();
        $e = EmailIdentity::where('tenant_id', $tenantId)->get();
        return ['branding' => $b, 'domains' => $d, 'email_identities' => $e];
    }

    public function updateBranding(int $tenantId, array $data): ?TenantBranding
    {
        $b = TenantBranding::firstOrCreate(['tenant_id' => $tenantId], ['tenant_id' => $tenantId]);
        $b->update($data);
        return $b->fresh();
    }

    public function createDomain(int $tenantId, array $data): Domain
    {
        $data['tenant_id'] = $tenantId;
        return Domain::create($data);
    }

    public function createEmailIdentity(int $tenantId, array $data): EmailIdentity
    {
        $data['tenant_id'] = $tenantId;
        return EmailIdentity::create($data);
    }

    public function updateEmailIdentity(EmailIdentity $i, array $data): EmailIdentity
    {
        $i->update($data);
        return $i->fresh();
    }
}
