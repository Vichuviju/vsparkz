<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EcommerceStore;
use App\Models\EcommerceOrder;
use Illuminate\Http\Request;

class EcommerceController extends Controller
{
    public function index()
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        $stores = EcommerceStore::where('tenant_id', $tid)->get();
        return response()->json(['data' => $stores]);
    }

    public function store(Request $request)
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        $data = $request->validate([
            'platform' => 'required|string',
            'store_url' => 'required|url',
            'access_token' => 'nullable|string'
        ]);
        $data['tenant_id'] = $tid;
        $store = EcommerceStore::create($data);
        return response()->json($store, 201);
    }

    public function orders(Request $request)
    {
        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        $orders = EcommerceOrder::whereHas('store', function($q) use ($tid) {
            $q->where('tenant_id', $tid);
        })->latest()->paginate(20);
        return response()->json($orders);
    }
}
