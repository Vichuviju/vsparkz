<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    /** Get a setting value by key (cached for performance). */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $cacheKey = 'settings.' . $key;
        return Cache::remember($cacheKey, 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /** Set a setting value and clear cache. */
    public static function setValue(string $key, mixed $value, string $group = 'general'): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => is_array($value) || is_object($value) ? json_encode($value) : $value, 'group' => $group]
        );
        Cache::forget('settings.' . $key);
    }
}
