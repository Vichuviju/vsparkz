<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\Reward;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function badges()
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        return response()->json(['data' => Badge::where('tenant_id', $tid)->get()]);
    }

    public function storeBadge(Request $request)
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        $data = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'points_required' => 'required|integer'
        ]);
        $data['tenant_id'] = $tid;
        $badge = Badge::create($data);
        return response()->json($badge, 201);
    }

    public function rewards()
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        return response()->json(['data' => Reward::where('tenant_id', $tid)->get()]);
    }
}
