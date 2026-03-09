<?php

namespace App\Services\Integrations\Contracts;

interface EmailProviderAdapterInterface
{
    public function getSlug(): string;

    public function send(string $to, string $subject, string $bodyHtml, string $bodyText = '', array $options = []): array;
}
