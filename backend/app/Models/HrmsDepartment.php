<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrmsDepartment extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'tenant_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** All employees (users) in this department. */
    public function employees(): HasMany
    {
        return $this->hasMany(User::class, 'hrms_department_id');
    }
}
