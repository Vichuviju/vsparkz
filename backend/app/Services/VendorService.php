<?php

namespace App\Services;

use App\Models\Vendor;
use App\Models\VendorRateCard;
use App\Models\VendorAvailability;
use App\Models\VendorContract;
use App\Models\VendorPerformanceScore;

class VendorService
{
    public function listVendors($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return Vendor::where('tenant_id', $tid)->orderBy('name')->get();
    }

    public function createVendor(array $data, $tid = null): Vendor
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return Vendor::create($data);
    }

    public function updateVendor(Vendor $v, array $data): Vendor
    {
        $v->update($data);
        return $v->fresh();
    }

    public function addRateCard(Vendor $v, array $data): VendorRateCard
    {
        $data['vendor_id'] = $v->id;
        return VendorRateCard::create($data);
    }

    public function addAvailability(Vendor $v, array $data): VendorAvailability
    {
        $data['vendor_id'] = $v->id;
        return VendorAvailability::create($data);
    }

    public function createContract(Vendor $v, array $data, $tid = null): VendorContract
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        $data['vendor_id'] = $v->id;
        return VendorContract::create($data);
    }

    public function recordPerformanceScore(Vendor $v, array $data): VendorPerformanceScore
    {
        $data['vendor_id'] = $v->id;
        return VendorPerformanceScore::create($data);
    }
}
