<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SiteSettingsController extends Controller
{
    /**
     * Public site settings (name, logo URL, tagline) for header/footer.
     */
    public function show(): JsonResponse
    {
        $siteName = Setting::getValue('site_name', 'Vsparkz Digital');
        $siteTagline = Setting::getValue('site_tagline', '');
        $logoMediaId = Setting::getValue('logo_media_id');
        $logoUrl = null;
        if ($logoMediaId) {
            $media = Media::find($logoMediaId);
            if ($media) {
                $logoUrl = $media->url ?? \Storage::disk($media->disk ?? 'public')->url($media->path);
            }
        }
        return response()->json([
            'site_name' => $siteName,
            'site_tagline' => $siteTagline,
            'logo_url' => $logoUrl,
        ]);
    }
}
