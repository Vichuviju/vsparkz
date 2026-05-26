<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EcommerceStore extends Model
{
    protected $fillable = ['tenant_id', 'platform', 'store_url', 'access_token', 'status'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function orders()
    {
        return $this->hasMany(EcommerceOrder::class);
    }
}
