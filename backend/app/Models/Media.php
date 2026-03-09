<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $fillable = [
        'path',
        'filename',
        'mime_type',
        'size',
        'disk',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function getUrlAttribute(): string
    {
        return \Storage::disk($this->disk)->url($this->path);
    }
}
