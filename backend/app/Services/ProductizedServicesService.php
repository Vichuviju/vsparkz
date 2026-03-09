<?php

namespace App\Services;

use App\Models\ServicePackage;
use App\Models\ServicePackageItem;
use App\Models\ServicePackageRule;
use App\Models\ProposalTemplate;

class ProductizedServicesService
{
    public function listPackages($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return ServicePackage::where('tenant_id', $tid)->orderBy('name')->get();
    }

    public function createPackage(array $data, $tid = null): ServicePackage
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return ServicePackage::create($data);
    }

    public function updatePackage(ServicePackage $pkg, array $data): ServicePackage
    {
        $pkg->update($data);
        return $pkg->fresh();
    }

    public function addPackageItem(ServicePackage $pkg, array $data): ServicePackageItem
    {
        $data['service_package_id'] = $pkg->id;
        return ServicePackageItem::create($data);
    }

    public function addPackageRule(ServicePackage $pkg, array $data): ServicePackageRule
    {
        $data['service_package_id'] = $pkg->id;
        return ServicePackageRule::create($data);
    }

    public function listProposalTemplates($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return ProposalTemplate::where('tenant_id', $tid)->orderBy('name')->get();
    }

    public function createProposalTemplate(array $data, $tid = null): ProposalTemplate
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return ProposalTemplate::create($data);
    }
}
