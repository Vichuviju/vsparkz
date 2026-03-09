<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ServicePrice;

class ComboPackage extends Model
{
    protected $fillable = [
        'name',
        'tagline',
        'short_description',
        'display_order',
        'pdf_path',
        'discount_type',
        'discount_value',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ComboPackageItem::class, 'combo_package_id');
    }

    public function offerDocuments(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(OfferDocument::class, 'offer_document_combo_package')
            ->withPivot('sort_order');
    }

    /** Return computed subtotal, discount, total, and total_duration from items (requires items with subService loaded). */
    public function getComputedTotals(): array
    {
        $items = $this->relationLoaded('items') ? $this->items : $this->items()->with('subService')->get();
        $subtotal = 0;
        $durationByUnit = [];
        foreach ($items as $item) {
            $qty = $item->quantity ?? 1;
            $price = null;
            $durVal = null;
            $durUnit = null;
            if ($item->sub_service_id && $item->subService) {
                if ($item->pricing_level_id) {
                    $sp = ServicePrice::where('service_id', $item->service_id)
                        ->where('sub_service_id', $item->sub_service_id)
                        ->where('pricing_level_id', $item->pricing_level_id)
                        ->first();
                    if ($sp) {
                        $price = (float) $sp->amount;
                        $durVal = $sp->duration_value;
                        $durUnit = $sp->duration_unit;
                    }
                }
                if ($price === null && $item->subService->average_price !== null) {
                    $price = (float) $item->subService->average_price;
                    $durVal = $item->subService->average_duration_value;
                    $durUnit = $item->subService->average_duration_unit;
                }
                if ($price !== null) {
                    $subtotal += $price * $qty;
                }
                if ($durVal !== null && $durUnit) {
                    $durationByUnit[$durUnit] = ($durationByUnit[$durUnit] ?? 0) + (int) $durVal * $qty;
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
        $discount = $this->discount_type === 'percent'
            ? $subtotal * ((float) $this->discount_value / 100)
            : (float) $this->discount_value;
        $total = max(0, $subtotal - $discount);
        return [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'total' => round($total, 2),
            'total_duration' => $durationByUnit,
        ];
    }
}
