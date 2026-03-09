<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * GET /api/admin/settings - Return all settings as key-value (for SEO, site name, etc.).
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * PUT /api/admin/settings - Update multiple settings (key => value).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable',
        ]);
        foreach ($validated['settings'] as $key => $value) {
            if (is_string($key) && strlen($key) <= 255) {
                Setting::setValue($key, $value);
            }
        }
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }
}
