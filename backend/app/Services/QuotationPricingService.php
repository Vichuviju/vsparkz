<?php

namespace App\Services;

use App\Models\FreelancerMasterPricing;
use App\Models\ServicePrice;
use Illuminate\Support\Facades\DB;

class QuotationPricingService
{
    /**
     * Get unit price for a sub-service, optionally by freelancer and time period.
     * Uses freelancer_master_pricing first, then falls back to service_prices (by pricing_level or first).
     */
    public function getUnitPrice(?int $subServiceId, ?int $freelancerId, string $timePeriod): float
    {
        if ($freelancerId && $subServiceId) {
            $fp = FreelancerMasterPricing::where('freelancer_id', $freelancerId)
                ->where('sub_service_id', $subServiceId)
                ->where('time_period', $timePeriod)
                ->first();
            if ($fp !== null) {
                return (float) $fp->amount;
            }
        }

        if (! $subServiceId) {
            return 0.0;
        }

        $frequency = $this->mapTimePeriodToFrequency($timePeriod);
        $sp = ServicePrice::where('sub_service_id', $subServiceId)
            ->whereIn('frequency', [$frequency, 'one-time'])
            ->orderByDesc('amount')
            ->first();
        if ($sp) {
            return (float) $sp->amount;
        }

        return 0.0;
    }

    private function mapTimePeriodToFrequency(string $timePeriod): string
    {
        return match ($timePeriod) {
            'weekly' => 'weekly',
            'monthly' => 'monthly',
            'yearly' => 'monthly',
            default => 'one-time',
        };
    }
}
