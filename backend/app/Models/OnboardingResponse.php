<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingResponse extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'client_id', 'onboarding_questionnaire_id', 'responses_json', 'submitted_at', 'submitted_by',
    ];

    protected $casts = [
        'responses_json' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function onboardingQuestionnaire(): BelongsTo
    {
        return $this->belongsTo(OnboardingQuestionnaire::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
