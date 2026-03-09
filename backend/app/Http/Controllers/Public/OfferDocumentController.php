<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\OfferDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferDocumentController extends Controller
{
    /** GET /api/offer-documents - list active package generators for website (show to website). */
    public function index(): JsonResponse
    {
        $docs = OfferDocument::where('is_active', true)
            ->with(['comboPackages' => function ($q) {
                $q->where('combo_packages.is_active', true)->orderBy('offer_document_combo_package.sort_order');
            }, 'comboPackages.items.subService.service'])
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();
        $list = $docs->map(function (OfferDocument $doc) {
            $combos = $doc->comboPackages->map(function ($combo) {
                $totals = $combo->getComputedTotals();
                return [
                    'id' => $combo->id,
                    'name' => $combo->name,
                    'tagline' => $combo->tagline,
                    'short_description' => $combo->short_description,
                    'total' => $totals['total'],
                    'subtotal' => $totals['subtotal'],
                    'discount' => $totals['discount'],
                    'total_duration' => $totals['total_duration'],
                    'items' => $combo->items->map(fn ($i) => [
                        'name' => $i->subService ? $i->subService->name : (optional($i->service)->title ?? '—'),
                        'quantity' => $i->quantity ?? 1,
                    ]),
                ];
            });
            return [
                'id' => $doc->id,
                'name' => $doc->name,
                'slug' => $doc->slug,
                'pricing_title' => $doc->pricing_title,
                'limited_offer_text' => $doc->limited_offer_text,
                'sidebar_features' => $doc->sidebar_features,
                'payment_note' => $doc->payment_note,
                'company_name' => $doc->company_name,
                'tagline' => $doc->tagline,
                'combos' => $combos,
            ];
        });
        return response()->json($list);
    }

    /** GET /api/offer-documents/{id} - single offer document. Use ?preview=1 to load inactive docs (for admin preview). */
    public function show(Request $request, int $id): JsonResponse
    {
        $query = OfferDocument::with(['comboPackages' => function ($q) {
            $q->orderBy('offer_document_combo_package.sort_order');
        }, 'comboPackages.items.subService.service']);
        if (! $request->boolean('preview')) {
            $query->where('is_active', true);
        }
        $doc = $query->findOrFail($id);
        $combos = $doc->comboPackages->map(function ($combo) {
            $totals = $combo->getComputedTotals();
            return [
                'id' => $combo->id,
                'name' => $combo->name,
                'tagline' => $combo->tagline,
                'short_description' => $combo->short_description,
                'total' => $totals['total'],
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'total_duration' => $totals['total_duration'],
                'items' => $combo->items->map(fn ($i) => [
                    'name' => $i->subService ? $i->subService->name : (optional($i->service)->title ?? '—'),
                    'quantity' => $i->quantity ?? 1,
                ]),
            ];
        });
        return response()->json([
            'id' => $doc->id,
            'name' => $doc->name,
            'slug' => $doc->slug,
            'pricing_title' => $doc->pricing_title,
            'limited_offer_text' => $doc->limited_offer_text,
            'sidebar_features' => $doc->sidebar_features,
            'payment_note' => $doc->payment_note,
            'company_name' => $doc->company_name,
            'tagline' => $doc->tagline,
            'combos' => $combos,
        ]);
    }
}
