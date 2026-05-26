<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    protected $fillable = ['tenant_id', 'name', 'description', 'points_cost'];
}
