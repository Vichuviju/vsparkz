<?php

namespace App\Services\Integrations\Contracts;

interface AiProviderAdapterInterface
{
    public function getSlug(): string;

    public function complete(array $input): array;
}
