<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Agreement extends Model
{
    protected $fillable = [
        'client_id',
        'project_id',
        'quotation_id',
        'title',
        'scope',
        'timeline',
        'payment_terms',
        'status',
        'signed_at',
        'file_path',
        'rework_comments',
    ];

    protected $casts = ['signed_at' => 'datetime'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }
}
