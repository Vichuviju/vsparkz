<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeSpace extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'visibility', 'allowed_roles_json',
    ];

    protected $casts = [
        'allowed_roles_json' => 'array',
    ];

    public function articles(): HasMany
    {
        return $this->hasMany(KnowledgeArticle::class);
    }
}
