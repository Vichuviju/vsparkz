<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OnboardingQuestionnaire extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'definition_json', 'is_default',
    ];

    protected $casts = [
        'definition_json' => 'array',
        'is_default' => 'boolean',
    ];

    public function responses(): HasMany
    {
        return $this->hasMany(OnboardingResponse::class);
    }
}
