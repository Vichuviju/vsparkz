<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Service extends Model
{
    use HasFactory;

    public const TYPE_ONE_TIME = 'one-time';
    public const TYPE_RECURRING = 'recurring';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'icon',
        'image',
        'sort_order',
        'is_active',
        'category',
        'service_type',
        'default_duration_value',
        'default_duration_unit',
        'dependencies',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'dependencies' => 'array',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function subServices(): HasMany
    {
        return $this->hasMany(SubService::class);
    }

    public function servicePrices(): HasMany
    {
        return $this->hasMany(ServicePrice::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Service $service): void {
            if (empty($service->slug)) {
                $service->slug = Str::slug($service->title);
            }
        });
    }
}
