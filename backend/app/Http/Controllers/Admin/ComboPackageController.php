<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ComboPackage;
use App\Models\ServicePrice;
use App\Models\SubService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ComboPackageController extends Controller
{
    public function index(): JsonResponse
    {
        $items = ComboPackage::with('items.service', 'items.subService', 'items.pricingLevel')->orderBy('id')->get();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'short_description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
            'discount_type' => 'required|string|in:flat,percent',
            'discount_value' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'items' => 'nullable|array',
            'items.*.service_id' => 'required_without:items.*.sub_service_id|nullable|exists:services,id',
            'items.*.sub_service_id' => 'nullable|exists:sub_services,id',
            'items.*.pricing_level_id' => 'nullable|exists:pricing_levels,id',
            'items.*.quantity' => 'nullable|integer|min:1',
        ]);
        $combo = ComboPackage::create([
            'name' => $validated['name'],
            'tagline' => $validated['tagline'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
            'discount_type' => $validated['discount_type'],
            'discount_value' => $validated['discount_value'],
            'is_active' => $validated['is_active'] ?? true,
        ]);
        if (! empty($validated['items'])) {
            foreach ($validated['items'] as $it) {
                $serviceId = $it['service_id'] ?? null;
                $subServiceId = $it['sub_service_id'] ?? null;
                if ($subServiceId && ! $serviceId) {
                    $sub = SubService::find($subServiceId);
                    if ($sub) {
                        $serviceId = $sub->service_id;
                    }
                }
                $combo->items()->create([
                    'service_id' => $serviceId,
                    'sub_service_id' => $subServiceId,
                    'pricing_level_id' => $it['pricing_level_id'] ?? null,
                    'quantity' => $it['quantity'] ?? 1,
                ]);
            }
        }
        return response()->json($combo->load(['items.service', 'items.subService', 'items.pricingLevel']), 201);
    }

    public function show(ComboPackage $comboPackage): JsonResponse
    {
        return response()->json($comboPackage->load(['items.service', 'items.subService', 'items.pricingLevel']));
    }

    public function update(Request $request, ComboPackage $comboPackage): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'short_description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
            'discount_type' => 'sometimes|string|in:flat,percent',
            'discount_value' => 'sometimes|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable|exists:combo_package_items,id',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.sub_service_id' => 'nullable|exists:sub_services,id',
            'items.*.pricing_level_id' => 'nullable|exists:pricing_levels,id',
            'items.*.quantity' => 'nullable|integer|min:1',
        ]);
        $comboPackage->update([
            'name' => $validated['name'] ?? $comboPackage->name,
            'tagline' => array_key_exists('tagline', $validated) ? $validated['tagline'] : $comboPackage->tagline,
            'short_description' => array_key_exists('short_description', $validated) ? $validated['short_description'] : $comboPackage->short_description,
            'display_order' => $validated['display_order'] ?? $comboPackage->display_order,
            'discount_type' => $validated['discount_type'] ?? $comboPackage->discount_type,
            'discount_value' => $validated['discount_value'] ?? $comboPackage->discount_value,
            'is_active' => $validated['is_active'] ?? $comboPackage->is_active,
        ]);
        if (array_key_exists('items', $validated)) {
            $comboPackage->items()->delete();
            foreach ($validated['items'] as $it) {
                $serviceId = $it['service_id'] ?? null;
                $subServiceId = $it['sub_service_id'] ?? null;
                if ($subServiceId && ! $serviceId) {
                    $sub = SubService::find($subServiceId);
                    if ($sub) {
                        $serviceId = $sub->service_id;
                    }
                }
                $comboPackage->items()->create([
                    'service_id' => $serviceId,
                    'sub_service_id' => $subServiceId,
                    'pricing_level_id' => $it['pricing_level_id'] ?? null,
                    'quantity' => $it['quantity'] ?? 1,
                ]);
            }
        }
        return response()->json($comboPackage->fresh()->load(['items.service', 'items.subService', 'items.pricingLevel']));
    }

    public function destroy(ComboPackage $comboPackage): JsonResponse
    {
        $comboPackage->delete();
        return response()->json(['message' => 'Combo package deleted']);
    }

    /** Preview total for combo (subtotal - discount). Uses subservice average_price when item has sub_service_id and no pricing_level. */
    public function preview(ComboPackage $comboPackage): JsonResponse
    {
        $comboPackage->load(['items.service', 'items.subService.service', 'items.pricingLevel']);
        return response()->json($comboPackage->getComputedTotals());
    }

    /** Preview calculation from payload: sub_service_ids + quantities + discount. POST /admin/combo-packages/preview-calc */
    public function previewCalculation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.sub_service_id' => 'required|exists:sub_services,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'discount_type' => 'nullable|string|in:flat,percent',
            'discount_value' => 'nullable|numeric|min:0',
        ]);
        $items = collect($validated['items'])->map(fn ($it) => (object) [
            'sub_service_id' => $it['sub_service_id'],
            'quantity' => $it['quantity'] ?? 1,
            'service_id' => null,
            'pricing_level_id' => null,
        ]);
        $subServices = SubService::with('service')->whereIn('id', $items->pluck('sub_service_id'))->get()->keyBy('id');
        $virtualItems = $items->map(function ($it) use ($subServices) {
            $ss = $subServices->get($it->sub_service_id);
            $obj = (object) [
                'service_id' => $ss?->service_id,
                'sub_service_id' => $it->sub_service_id,
                'subService' => $ss,
                'pricing_level_id' => null,
                'quantity' => $it->quantity,
            ];
            return $obj;
        });
        $discountType = $validated['discount_type'] ?? 'percent';
        $discountValue = (float) ($validated['discount_value'] ?? 0);
        $result = $this->computeComboTotals($virtualItems, $discountType, $discountValue);
        return response()->json($result);
    }

    private function computeComboTotals($items, string $discountType, float $discountValue): array
    {
        $subtotal = 0;
        $durationByUnit = [];
        foreach ($items as $item) {
            $qty = $item->quantity ?? 1;
            $price = null;
            $durationValue = null;
            $durationUnit = null;
            if ($item->sub_service_id && ($item->subService ?? null)) {
                $ss = $item->subService;
                if ($item->pricing_level_id) {
                    $sp = ServicePrice::where('service_id', $ss->service_id)
                        ->where('sub_service_id', $ss->id)
                        ->where('pricing_level_id', $item->pricing_level_id)
                        ->first();
                    if ($sp) {
                        $price = (float) $sp->amount;
                        $durationValue = $sp->duration_value;
                        $durationUnit = $sp->duration_unit;
                    }
                }
                if ($price === null && $ss->average_price !== null) {
                    $price = (float) $ss->average_price;
                    $durationValue = $ss->average_duration_value;
                    $durationUnit = $ss->average_duration_unit;
                }
                if ($price !== null) {
                    $subtotal += $price * $qty;
                }
                if ($durationValue !== null && $durationUnit) {
                    $durationByUnit[$durationUnit] = ($durationByUnit[$durationUnit] ?? 0) + (int) $durationValue * $qty;
                }
            } else {
                $sp = ServicePrice::where('service_id', $item->service_id)
                    ->where('sub_service_id', $item->sub_service_id)
                    ->where('pricing_level_id', $item->pricing_level_id)
                    ->first();
                if ($sp) {
                    $subtotal += (float) $sp->amount * $qty;
                    if ($sp->duration_value !== null && $sp->duration_unit) {
                        $durationByUnit[$sp->duration_unit] = ($durationByUnit[$sp->duration_unit] ?? 0) + (int) $sp->duration_value * $qty;
                    }
                }
            }
        }
        $discount = $discountType === 'percent'
            ? $subtotal * ($discountValue / 100)
            : $discountValue;
        $total = max(0, $subtotal - $discount);
        return [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'total' => round($total, 2),
            'total_duration' => $durationByUnit,
        ];
    }

    /** Download combo package as PDF. GET /admin/combo-packages/{id}/pdf */
    public function downloadPdf(ComboPackage $comboPackage): Response
    {
        $comboPackage->load(['items.service', 'items.subService.service', 'items.pricingLevel']);
        $totals = $comboPackage->getComputedTotals();
        $pdf = app('dompdf.wrapper')->loadView('pdf.combo_package', [
            'comboPackage' => $comboPackage,
            'totals' => $totals,
        ]);
        return $pdf->download('combo-package-' . $comboPackage->id . '.pdf');
    }

    /** Generate and store PDF; set pdf_path on combo. POST /admin/combo-packages/{id}/generate-pdf */
    public function generatePdf(ComboPackage $comboPackage): JsonResponse
    {
        $comboPackage->load(['items.service', 'items.subService.service', 'items.pricingLevel']);
        $totals = $comboPackage->getComputedTotals();
        $pdf = app('dompdf.wrapper')->loadView('pdf.combo_package', [
            'comboPackage' => $comboPackage,
            'totals' => $totals,
        ]);
        $dir = 'offers';
        $filename = 'combo-' . $comboPackage->id . '.pdf';
        $path = $dir . '/' . $filename;
        Storage::disk('local')->put($path, $pdf->output());
        $comboPackage->update(['pdf_path' => $path]);
        return response()->json(['pdf_path' => $path, 'message' => 'PDF generated']);
    }
}
