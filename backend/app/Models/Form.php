<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Form extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'embed_script_token',
        'definition_json',
        'destination_type',
        'destination_config_json',
        'status',
    ];

    protected $casts = [
        'definition_json' => 'array',
        'destination_config_json' => 'array',
    ];

    public function formSubmissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }
}
