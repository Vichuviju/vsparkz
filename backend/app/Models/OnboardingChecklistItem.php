<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingChecklistItem extends Model
{
    protected $fillable = [
        'onboarding_checklist_id', 'name', 'description', 'is_completed', 'completed_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function onboardingChecklist(): BelongsTo
    {
        return $this->belongsTo(OnboardingChecklist::class);
    }
}
