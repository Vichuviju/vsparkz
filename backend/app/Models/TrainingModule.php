<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrainingModule extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'title', 'description', 'content_json', 'target_roles_json', 'status',
    ];

    protected $casts = [
        'content_json' => 'array',
        'target_roles_json' => 'array',
    ];

    public function trainingProgress(): HasMany
    {
        return $this->hasMany(TrainingProgress::class);
    }
}
