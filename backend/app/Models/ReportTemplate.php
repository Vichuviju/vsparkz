<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportTemplate extends Model
{
    protected $table = 'report_templates';

    protected $fillable = ['tenant_id', 'name', 'description', 'scope', 'layout_json', 'config_json'];

    protected $casts = ['layout_json' => 'array', 'config_json' => 'array'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
