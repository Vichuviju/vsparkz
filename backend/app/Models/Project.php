<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'agency_id', // alias for tenant_id (redirected in mutator; no DB column after evolve)
        'client_id',
        'service_id',
        'freelancer_id',
        'name',
        'campaign_type',
        'status',
        'workflow_status',
        'quotation_id',
        'agreement_id',
        'project_manager_id',
        'stage',
        'next_appointment_at',
        'next_appointment_type',
        'start_date',
        'end_date',
        'deliverables',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'next_appointment_at' => 'datetime',
        'deliverables' => 'array',
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_ON_HOLD = 'on_hold';

    public const WORKFLOW_PROJECT_INITIALIZED = 'project_initialized';
    public const WORKFLOW_REQUIREMENT_GATHERING = 'requirement_gathering';
    public const WORKFLOW_QUOTATION_PROCESSING = 'quotation_processing';
    public const WORKFLOW_QUOTATION_GENERATED = 'quotation_generated';
    public const WORKFLOW_QUOTATION_REJECTED = 'quotation_rejected';
    public const WORKFLOW_QUOTATION_RESUBMITTED = 'quotation_resubmitted';
    public const WORKFLOW_AGREEMENT_GENERATION = 'agreement_generation';
    public const WORKFLOW_AGREEMENT_REWORK = 'agreement_rework';
    public const WORKFLOW_WORK_IN_PROGRESS = 'work_in_progress';
    public const WORKFLOW_COMPLETED = 'completed';
    public const WORKFLOW_CANCELLED = 'cancelled';

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    public function projectTasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'project_id');
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class, 'project_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'project_id');
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class, 'project_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /** Read: agency_id is an alias for tenant_id (column was renamed in evolve migration). */
    public function getAgencyIdAttribute(): mixed
    {
        return $this->attributes['tenant_id'] ?? null;
    }

    /** Write: set agency_id on the model actually sets tenant_id so SQL uses tenant_id. */
    public function setAgencyIdAttribute(mixed $value): void
    {
        $this->attributes['tenant_id'] = $value;
        unset($this->attributes['agency_id']);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function agreement(): BelongsTo
    {
        return $this->belongsTo(Agreement::class);
    }

    public function projectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(ProjectStatusLog::class)->orderByDesc('created_at');
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(ProjectMeeting::class)->orderBy('scheduled_at');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ProjectAssignment::class);
    }
}
