<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\Lead;
use Illuminate\Support\Str;

class FormPlatformService
{
    public function createForm(array $data, ?int $tenantId = null): Form
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        $data['tenant_id'] = $tenantId;
        if (empty($data['embed_script_token'])) {
            $data['embed_script_token'] = Str::random(32);
        }
        return Form::create($data);
    }

    public function recordSubmission(Form $form, array $payload, ?string $sourceUrl = null, ?array $utm = null): FormSubmission
    {
        $leadId = null;
        $clientId = null;
        if ($form->destination_type === 'lead' && !empty($payload['email'])) {
            $lead = Lead::create([
                'tenant_id' => $form->tenant_id,
                'name' => $payload['name'] ?? $payload['email'],
                'email' => $payload['email'],
                'phone' => $payload['phone'] ?? null,
                'message' => is_string($payload['message'] ?? null) ? $payload['message'] : json_encode($payload),
                'status' => Lead::STATUS_NEW,
                'source' => 'form:' . $form->slug,
            ]);
            $leadId = $lead->id;
        }
        return FormSubmission::create([
            'tenant_id' => $form->tenant_id,
            'form_id' => $form->id,
            'lead_id' => $leadId,
            'client_id' => $clientId,
            'submitted_at' => now(),
            'payload_json' => $payload,
            'source_url' => $sourceUrl,
            'utm_json' => $utm,
        ]);
    }
}
