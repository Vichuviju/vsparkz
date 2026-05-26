<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $fillable = ['tenant_id', 'name', 'description', 'icon_url', 'points_required'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_badges');
    }
}
