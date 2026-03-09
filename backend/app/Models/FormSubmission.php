<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormSubmission extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'form_id',
        'lead_id',
        'client_id',
        'submitted_at',
        'payload_json',
        'source_url',
        'utm_json',
    ];

    protected $casts = [
        'payload_json' => 'array',
        'utm_json' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
