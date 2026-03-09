<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RequirementGathering extends Model
{
    protected $fillable = ['client_id', 'project_id', 'service_ids', 'expectations', 'selected_requirements'];

    protected $casts = [
        'service_ids' => 'array',
        'selected_requirements' => 'array',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(RequirementDocument::class, 'requirement_gathering_id');
    }
}
