<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailAutomationRule extends Model
{
    use BelongsToTenant;

    protected $table = 'email_automation_rules';

    protected $fillable = [
        'tenant_id', 'name', 'trigger_type', 'trigger_config_json', 'is_active',
    ];

    protected $casts = [
        'trigger_config_json' => 'array',
        'is_active' => 'boolean',
    ];

    public function emailSequences(): HasMany
    {
        return $this->hasMany(EmailSequence::class, 'email_automation_rule_id');
    }
}
