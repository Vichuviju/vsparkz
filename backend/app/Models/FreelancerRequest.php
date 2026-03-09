<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerRequest extends Model
{
    protected $fillable = ['freelancer_id', 'name', 'email', 'phone', 'work_details', 'status'];

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }
}
