<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectAssignment extends Model
{
    protected $fillable = [
        'project_id',
        'assignable_type',
        'assignable_id',
        'role',
        'client_requirement_description',
        'timeline',
        'service_id',
        'quotation_service_id',
    ];

    public const ROLE_PROJECT_MANAGER = 'project_manager';
    public const ROLE_FREELANCER = 'freelancer';
    public const ROLE_EMPLOYEE = 'employee';

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignable(): MorphTo
    {
        return $this->morphTo();
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function quotationService(): BelongsTo
    {
        return $this->belongsTo(QuotationService::class);
    }

    public function projectTasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'assignment_id');
    }
}
