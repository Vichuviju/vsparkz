<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'type',
        'reference_id',
        'title',
        'payload',
        'file_path',
    ];

    protected $casts = [
        'reference_id' => 'integer',
        'payload' => 'array',
    ];

    public const TYPE_SEO = 'seo';
    public const TYPE_INFLUENCER = 'influencer';
    public const TYPE_CAMPAIGN = 'campaign';
    public const TYPE_CLIENT = 'client';
}
