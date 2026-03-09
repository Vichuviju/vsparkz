<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OfferDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class OfferDocumentController extends Controller
{
    public function index(): JsonResponse
    {
        $items = OfferDocument::with('comboPackages.items.subService')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:offer_documents,slug',
            'pricing_title' => 'nullable|string|max:100',
            'limited_offer_text' => 'nullable|string',
            'sidebar_features' => 'nullable|array',
            'sidebar_features.*' => 'string|max:255',
            'payment_note' => 'nullable|string|max:255',
            'logo_path' => 'nullable|string|max:500',
            'company_name' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'combo_package_ids' => 'nullable|array',
            'combo_package_ids.*' => 'exists:combo_packages,id',
        ]);
        $doc = OfferDocument::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'pricing_title' => $validated['pricing_title'] ?? 'PRICING',
            'limited_offer_text' => $validated['limited_offer_text'] ?? null,
            'sidebar_features' => $validated['sidebar_features'] ?? null,
            'payment_note' => $validated['payment_note'] ?? null,
            'logo_path' => $validated['logo_path'] ?? null,
            'company_name' => $validated['company_name'] ?? null,
            'tagline' => $validated['tagline'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);
        if (! empty($validated['combo_package_ids'])) {
            $sync = [];
            foreach (array_values($validated['combo_package_ids']) as $i => $id) {
                $sync[$id] = ['sort_order' => $i];
            }
            $doc->comboPackages()->sync($sync);
        }
        return response()->json($doc->load('comboPackages'), 201);
    }

    public function show(OfferDocument $offerDocument): JsonResponse
    {
        $offerDocument->load(['comboPackages.items.subService.service', 'comboPackages.items.pricingLevel']);
        return response()->json($offerDocument);
    }

    public function update(Request $request, OfferDocument $offerDocument): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:offer_documents,slug,' . $offerDocument->id,
            'pricing_title' => 'nullable|string|max:100',
            'limited_offer_text' => 'nullable|string',
            'sidebar_features' => 'nullable|array',
            'sidebar_features.*' => 'string|max:255',
            'payment_note' => 'nullable|string|max:255',
            'logo_path' => 'nullable|string|max:500',
            'company_name' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'combo_package_ids' => 'nullable|array',
            'combo_package_ids.*' => 'exists:combo_packages,id',
        ]);
        $offerDocument->update([
            'name' => $validated['name'] ?? $offerDocument->name,
            'slug' => array_key_exists('slug', $validated) ? $validated['slug'] : $offerDocument->slug,
            'pricing_title' => $validated['pricing_title'] ?? $offerDocument->pricing_title,
            'limited_offer_text' => array_key_exists('limited_offer_text', $validated) ? $validated['limited_offer_text'] : $offerDocument->limited_offer_text,
            'sidebar_features' => array_key_exists('sidebar_features', $validated) ? $validated['sidebar_features'] : $offerDocument->sidebar_features,
            'payment_note' => array_key_exists('payment_note', $validated) ? $validated['payment_note'] : $offerDocument->payment_note,
            'logo_path' => array_key_exists('logo_path', $validated) ? $validated['logo_path'] : $offerDocument->logo_path,
            'company_name' => array_key_exists('company_name', $validated) ? $validated['company_name'] : $offerDocument->company_name,
            'tagline' => array_key_exists('tagline', $validated) ? $validated['tagline'] : $offerDocument->tagline,
            'display_order' => $validated['display_order'] ?? $offerDocument->display_order,
            'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $offerDocument->is_active,
        ]);
        if (array_key_exists('combo_package_ids', $validated)) {
            $sync = [];
            foreach (array_values($validated['combo_package_ids']) as $i => $id) {
                $sync[$id] = ['sort_order' => $i];
            }
            $offerDocument->comboPackages()->sync($sync);
        }
        return response()->json($offerDocument->fresh()->load(['comboPackages.items.subService.service', 'comboPackages.items.pricingLevel']));
    }

    public function destroy(OfferDocument $offerDocument): JsonResponse
    {
        $offerDocument->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /** Live preview payload for frontend to render (same structure as PDF). */
    public function preview(OfferDocument $offerDocument): JsonResponse
    {
        $offerDocument->load(['comboPackages.items.subService.service', 'comboPackages.items.pricingLevel']);
        $combosWithTotals = $offerDocument->comboPackages->map(function ($combo) {
            return [
                'id' => $combo->id,
                'name' => $combo->name,
                'tagline' => $combo->tagline,
                'short_description' => $combo->short_description,
                'totals' => $combo->getComputedTotals(),
                'items' => $combo->items->map(function ($item) {
                    $name = $item->subService ? $item->subService->name : (optional($item->service)->title ?? '—');
                    return [
                        'name' => $name,
                        'quantity' => $item->quantity ?? 1,
                        'description' => $item->subService->description ?? null,
                    ];
                }),
            ];
        });
        return response()->json([
            'document' => [
                'name' => $offerDocument->name,
                'pricing_title' => $offerDocument->pricing_title,
                'limited_offer_text' => $offerDocument->limited_offer_text,
                'sidebar_features' => $offerDocument->sidebar_features,
                'payment_note' => $offerDocument->payment_note,
                'company_name' => $offerDocument->company_name,
                'tagline' => $offerDocument->tagline,
            ],
            'combos' => $combosWithTotals,
        ]);
    }

    /** Generate and download PDF (multi-column layout like image). */
    public function downloadPdf(OfferDocument $offerDocument): Response
    {
        $offerDocument->load(['comboPackages.items.subService.service', 'comboPackages.items.pricingLevel']);
        $pdf = app('dompdf.wrapper')->loadView('pdf.offer_document', ['offerDocument' => $offerDocument]);
        return $pdf->download('offer-' . Str::slug($offerDocument->name) . '.pdf');
    }
}
