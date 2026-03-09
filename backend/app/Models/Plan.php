<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = ['name', 'type', 'duration_days', 'price', 'currency', 'is_active'];

    protected $casts = ['price' => 'decimal:2', 'is_active' => 'boolean'];
}
