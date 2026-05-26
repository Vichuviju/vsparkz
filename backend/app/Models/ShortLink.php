<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShortLink extends Model
{
    protected $fillable = ['tenant_id', 'original_url', 'short_code', 'clicks'];
}
