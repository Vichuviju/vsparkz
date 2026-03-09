<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskUpdate extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'project_task_id',
        'user_id',
        'type',
        'content',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public const TYPE_WORK_UPDATE = 'work_update';
    public const TYPE_TIME_LOG = 'time_log';
    public const TYPE_COMMENT = 'comment';
    public const TYPE_QUESTION = 'question';

    public function projectTask(): BelongsTo
    {
        return $this->belongsTo(ProjectTask::class, 'project_task_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
