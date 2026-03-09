<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Location;
use App\Models\BrandAssignable;

class BrandManagementService
{
    public function listBrands($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return Brand::where('tenant_id', $tid)->orderBy('name')->get();
    }

    public function createBrand(array $data, $tid = null): Brand
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return Brand::create($data);
    }

    public function updateBrand(Brand $b, array $data): Brand
    {
        $b->update($data);
        return $b->fresh();
    }

    public function createLocation(Brand $brand, array $data, $tid = null): Location
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        $data['brand_id'] = $brand->id;
        return Location::create($data);
    }

    public function assignToBrand(Brand $brand, string $assignableType, int $assignableId): BrandAssignable
    {
        return BrandAssignable::firstOrCreate([
            'brand_id' => $brand->id,
            'assignable_type' => $assignableType,
            'assignable_id' => $assignableId,
        ]);
    }
}
