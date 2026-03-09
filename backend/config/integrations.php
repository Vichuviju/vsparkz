<?php

return [
    'slugs' => [
        'meta_ads' => ['type' => 'oauth', 'category' => 'ads', 'name' => 'Meta Ads'],
        'linkedin_ads' => ['type' => 'oauth', 'category' => 'ads', 'name' => 'LinkedIn Ads'],
        'google_ads' => ['type' => 'oauth', 'category' => 'ads', 'name' => 'Google Ads'],
        'google_business' => ['type' => 'oauth', 'category' => 'social', 'name' => 'Google Business Profile'],
        'sendgrid' => ['type' => 'api_key', 'category' => 'email', 'name' => 'SendGrid'],
        'ses' => ['type' => 'api_key', 'category' => 'email', 'name' => 'Amazon SES'],
        'smtp' => ['type' => 'manual', 'category' => 'email', 'name' => 'Custom SMTP'],
        'openai' => ['type' => 'api_key', 'category' => 'ai', 'name' => 'OpenAI'],
        'anthropic' => ['type' => 'api_key', 'category' => 'ai', 'name' => 'Anthropic'],
        'whatsapp_cloud' => ['type' => 'api_key', 'category' => 'communication', 'name' => 'WhatsApp Cloud API'],
    ],
];
