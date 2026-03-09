<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormWidget extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'form_id', 'widget_type', 'config_json', 'status',
    ];

    protected $casts = [
        'config_json' => 'array',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
