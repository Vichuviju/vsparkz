<?php

namespace App\Services\Integrations\Contracts;

interface ChannelAdapterInterface
{
    public function getSlug(): string;

    public function canPublish(): bool;

    public function publish(array $payload): array;
}
