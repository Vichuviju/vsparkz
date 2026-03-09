<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Influencer extends Model
{
    protected $fillable = [
        'name',
        'platform',
        'followers',
        'engagement_rate',
        'language',
        'location',
        'category',
        'email',
        'phone',
        'meta',
        'source',
        'status',
    ];

    protected $casts = [
        'followers' => 'integer',
        'engagement_rate' => 'decimal:2',
        'meta' => 'array',
    ];

    public const STATUS_NEW = 'new';
    public const STATUS_SHORTLISTED = 'shortlisted';
    public const STATUS_ASSIGNED = 'assigned';
}
