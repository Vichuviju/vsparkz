<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowTemplate extends Model
{
    use BelongsToTenant;

    protected $table = 'workflow_templates';

    protected $fillable = ['tenant_id', 'name', 'category', 'description', 'definition_json', 'is_active'];

    protected $casts = ['definition_json' => 'array', 'is_active' => 'boolean'];

    public function taskBlueprints(): HasMany
    {
        return $this->hasMany(TaskBlueprint::class)->orderBy('order');
    }
}
