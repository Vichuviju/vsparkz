<?php

namespace App\Exceptions;

use Exception;

class SaaSQuotaExceededException extends Exception
{
    public function __construct(string $message = 'Plan limit reached. Please upgrade.', int $code = 403, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    public function render($request)
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code' => 'quota_exceeded',
        ], 403);
    }
}
