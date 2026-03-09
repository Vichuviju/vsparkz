<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequirementTemplate extends Model
{
    protected $fillable = ['name', 'description', 'items', 'is_active'];

    protected $casts = [
        'items' => 'array',
        'is_active' => 'boolean',
    ];
}
