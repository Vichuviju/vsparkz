<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShortLink;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UtilityController extends Controller
{
    public function indexLinks()
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        return response()->json(['data' => ShortLink::where('tenant_id', $tid)->latest()->get()]);
    }

    public function storeLink(Request $request)
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        $data = $request->validate([
            'original_url' => 'required|url'
        ]);
        $data['tenant_id'] = $tid;
        $data['short_code'] = Str::random(6);
        $data['clicks'] = 0;
        
        $link = ShortLink::create($data);
        return response()->json($link, 201);
    }
}
