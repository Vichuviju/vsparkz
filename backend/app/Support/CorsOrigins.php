<?php

namespace App\Support;

class CorsOrigins
{
    /** @return list<string> */
    public static function allowed(): array
    {
        $defaults = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'https://vichuviju.github.io',
        ];

        $envOrigins = env('CORS_ALLOWED_ORIGINS');
        if (! $envOrigins) {
            return $defaults;
        }

        return array_values(array_unique(array_filter(array_map('trim', explode(',', $envOrigins)))));
    }

    public static function resolve(?string $origin): string
    {
        $allowed = self::allowed();

        if ($origin && in_array($origin, $allowed, true)) {
            return $origin;
        }

        return $allowed[0];
    }
}
