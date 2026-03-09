<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\ComboPackage;
use App\Models\FreelancerMasterPricing;
use App\Models\SubService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    /** GET /api/offers - list active combo packages with computed totals (public). */
    public function index(): JsonResponse
    {
        $combos = ComboPackage::where('is_active', true)
            ->with(['items.subService.service', 'items.pricingLevel'])
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();
        $list = $combos->map(function (ComboPackage $combo) {
            $totals = $combo->getComputedTotals();
            return [
                'id' => $combo->id,
                'name' => $combo->name,
                'tagline' => $combo->tagline,
                'short_description' => $combo->short_description,
                'display_order' => $combo->display_order,
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'total' => $totals['total'],
                'total_duration' => $totals['total_duration'],
                'items_count' => $combo->items->count(),
            ];
        });
        return response()->json($list);
    }

    /** GET /api/offers/{id} - single offer with items and totals (public). */
    public function show(int $id): JsonResponse
    {
        $combo = ComboPackage::where('is_active', true)
            ->with(['items.subService.service', 'items.pricingLevel'])
            ->findOrFail($id);
        $totals = $combo->getComputedTotals();
        $items = $combo->items->map(function ($item) {
            $name = $item->subService ? $item->subService->name : (optional($item->service)->title ?? '—');
            $price = null;
            $duration = null;
            if ($item->subService) {
                $price = $item->subService->average_price;
                if ($item->subService->average_duration_value !== null && $item->subService->average_duration_unit) {
                    $duration = $item->subService->average_duration_value . ' ' . $item->subService->average_duration_unit;
                }
            }
            return [
                'id' => $item->id,
                'sub_service_id' => $item->sub_service_id,
                'name' => $name,
                'description' => $item->subService->description ?? null,
                'quantity' => $item->quantity ?? 1,
                'price' => $price,
                'duration' => $duration,
            ];
        });
        return response()->json([
            'id' => $combo->id,
            'name' => $combo->name,
            'tagline' => $combo->tagline,
            'short_description' => $combo->short_description,
            'display_order' => $combo->display_order,
            'discount_type' => $combo->discount_type,
            'discount_value' => $combo->discount_value,
            'subtotal' => $totals['subtotal'],
            'discount' => $totals['discount'],
            'total' => $totals['total'],
            'total_duration' => $totals['total_duration'],
            'items' => $items,
        ]);
    }

    /** POST /api/custom-package-preview - calculate total for custom package (sub_service_ids + pricing_type). Optional freelancer_selections: { sub_service_id: freelancer_id } for freelance pricing per freelancer. */
    public function customPackagePreview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sub_service_ids' => 'required|array',
            'sub_service_ids.*' => 'integer|exists:sub_services,id',
            'pricing_type' => 'required|string|in:average,freelance',
            'freelancer_selections' => 'nullable|array',
            'freelancer_selections.*' => 'integer|exists:freelancers,id',
        ]);
        $subServices = SubService::whereIn('id', $validated['sub_service_ids'])->get();
        $freelancerSelections = $validated['freelancer_selections'] ?? [];
        $timePeriod = 'monthly';
        $subtotal = 0;
        $durationByUnit = [];
        foreach ($subServices as $ss) {
            $price = null;
            if ($validated['pricing_type'] === 'freelance' && isset($freelancerSelections[(string) $ss->id])) {
                $fid = (int) $freelancerSelections[(string) $ss->id];
                $fp = FreelancerMasterPricing::where('freelancer_id', $fid)
                    ->where('sub_service_id', $ss->id)
                    ->where('time_period', $timePeriod)
                    ->first();
                if ($fp) {
                    $price = (float) $fp->amount;
                }
            }
            if ($price === null) {
                $price = $ss->getPriceForType($validated['pricing_type']);
            }
            if ($price !== null) {
                $subtotal += $price;
            }
            if ($ss->average_duration_value !== null && $ss->average_duration_unit) {
                $u = $ss->average_duration_unit;
                $durationByUnit[$u] = ($durationByUnit[$u] ?? 0) + (int) $ss->average_duration_value;
            }
        }
        return response()->json([
            'subtotal' => round($subtotal, 2),
            'total_duration' => $durationByUnit,
        ]);
    }

    /** POST /api/custom-package-freelancers - return freelancers (with price) per sub_service for custom package when pricing type is freelance. */
    public function customPackageFreelancers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sub_service_ids' => 'required|array',
            'sub_service_ids.*' => 'integer|exists:sub_services,id',
            'time_period' => 'nullable|string|in:weekly,monthly,yearly',
        ]);
        $subServiceIds = $validated['sub_service_ids'];
        $timePeriod = $validated['time_period'] ?? 'monthly';
        $prices = FreelancerMasterPricing::whereIn('sub_service_id', $subServiceIds)
            ->where('time_period', $timePeriod)
            ->with('freelancer:id,name')
            ->get()
            ->groupBy('sub_service_id');
        $subServices = SubService::whereIn('id', $subServiceIds)->get()->keyBy('id');
        $result = [];
        foreach ($subServiceIds as $sid) {
            $ss = $subServices->get($sid);
            $freelancers = ($prices->get($sid) ?? collect())->map(function ($row) {
                return [
                    'freelancer_id' => $row->freelancer_id,
                    'name' => $row->freelancer->name ?? 'Freelancer #' . $row->freelancer_id,
                    'amount' => (float) $row->amount,
                ];
            })->values()->all();
            $result[] = [
                'sub_service_id' => (int) $sid,
                'sub_service_name' => $ss ? $ss->name : '',
                'freelancers' => $freelancers,
            ];
        }
        return response()->json(['sub_services' => $result]);
    }
}
