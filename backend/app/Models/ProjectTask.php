<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectTask extends Model
{
    protected $table = 'project_tasks';

    protected $fillable = [
        'project_id',
        'sub_service_id',
        'type',
        'title',
        'status',
        'due_date',
        'assigned_to',
        'freelancer_id',
        'assignment_id',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public const TYPE_SEO = 'seo';
    public const TYPE_SOCIAL = 'social';
    public const TYPE_INFLUENCER = 'influencer';
    public const TYPE_ADS = 'ads';

    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_REVIEW = 'review';
    public const STATUS_COMPLETED = 'completed';

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ProjectAssignment::class, 'assignment_id');
    }

    public function subService(): BelongsTo
    {
        return $this->belongsTo(SubService::class, 'sub_service_id');
    }

    public function taskUpdates(): HasMany
    {
        return $this->hasMany(TaskUpdate::class, 'project_task_id')->orderByDesc('created_at');
    }
}
