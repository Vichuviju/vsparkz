<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetVersion;
use Illuminate\Http\UploadedFile;

class AssetService
{
    public function createAsset(array $data, ?UploadedFile $file = null, ?int $tenantId = null): Asset
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $data['tenant_id'] = $tenantId;
        $data['owner_id'] = $data['owner_id'] ?? auth()->id();
        $data['source_type'] = $data['source_type'] ?? 'upload';
        if ($file) {
            $path = $file->store('assets/' . $tenantId, 'public');
            $data['file_path'] = $path;
            $data['mime_type'] = $file->getMimeType();
            $data['size'] = $file->getSize();
        }
        return Asset::create($data);
    }

    public function createVersion(Asset $asset, array $data, ?UploadedFile $file = null): AssetVersion
    {
        $next = ($asset->versions()->max('version_number') ?? 0) + 1;
        $path = $asset->file_path;
        if ($file) {
            $path = $file->store('assets/' . $asset->tenant_id, 'public');
        }
        return AssetVersion::create([
            'asset_id' => $asset->id,
            'version_number' => $next,
            'file_path' => $path,
            'change_summary' => $data['change_summary'] ?? null,
            'created_by' => auth()->id(),
        ]);
    }
}
