<?php

namespace App\Services;

use App\Models\Client;
use App\Models\OnboardingChecklist;
use App\Models\OnboardingChecklistItem;
use App\Models\OnboardingResponse;
use App\Models\BusinessGoal;
use App\Models\CompetitorIntake;
use App\Models\OnboardingQuestionnaire;

class ClientOnboardingService
{
    public function createChecklistForClient(Client $client, ?int $workflowInstanceId = null, ?int $tenantId = null): OnboardingChecklist
    {
        $tid = $tenantId ?? $client->tenant_id ?? auth()->user()?->tenant_id;
        return OnboardingChecklist::create([
            'tenant_id' => $tid,
            'client_id' => $client->id,
            'workflow_instance_id' => $workflowInstanceId,
            'status' => 'in_progress',
        ]);
    }

    public function addChecklistItem(OnboardingChecklist $checklist, array $data): OnboardingChecklistItem
    {
        $data['onboarding_checklist_id'] = $checklist->id;
        return OnboardingChecklistItem::create($data);
    }

    public function completeChecklistItem(OnboardingChecklistItem $item): OnboardingChecklistItem
    {
        $item->update(['is_completed' => true, 'completed_at' => now()]);
        $c = $item->onboardingChecklist;
        if ($c->items()->where('is_completed', false)->count() === 0) {
            $c->update(['status' => 'completed', 'completed_at' => now()]);
        }
        return $item->fresh();
    }

    public function saveQuestionnaireResponse(Client $client, int $qId, array $responsesJson, ?int $tenantId = null): OnboardingResponse
    {
        $tid = $tenantId ?? $client->tenant_id ?? auth()->user()?->tenant_id;
        return OnboardingResponse::updateOrCreate(
            ['client_id' => $client->id, 'onboarding_questionnaire_id' => $qId],
            ['tenant_id' => $tid, 'responses_json' => $responsesJson, 'submitted_at' => now(), 'submitted_by' => auth()->id()]
        );
    }

    public function addBusinessGoal(Client $client, array $data, ?int $tenantId = null): BusinessGoal
    {
        $data['tenant_id'] = $tenantId ?? $client->tenant_id ?? auth()->user()?->tenant_id;
        $data['client_id'] = $client->id;
        return BusinessGoal::create($data);
    }

    public function addCompetitorIntake(Client $client, array $data, ?int $tenantId = null): CompetitorIntake
    {
        $data['tenant_id'] = $tenantId ?? $client->tenant_id ?? auth()->user()?->tenant_id;
        $data['client_id'] = $client->id;
        return CompetitorIntake::create($data);
    }

    public function listQuestionnaires(?int $tenantId = null)
    {
        $tid = $tenantId ?? auth()->user()?->tenant_id;
        return OnboardingQuestionnaire::where('tenant_id', $tid)->orderBy('name')->get();
    }
}
