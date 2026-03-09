<?php

namespace App\Services;

use App\Jobs\RunEmailSequenceStepJob;
use App\Models\ContactList;
use App\Models\EmailSequence;
use App\Models\EmailSequenceStep;
use App\Models\Segment;

class EmailAutomationService
{
    public function listContactLists($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return ContactList::where('tenant_id', $tid)->orderBy('name')->get();
    }

    public function createContactList(array $data, $tid = null): ContactList
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return ContactList::create($data);
    }

    public function updateContactList(ContactList $list, array $data): ContactList
    {
        $list->update($data);
        return $list->fresh();
    }

    public function listSegments($tid = null, $contactListId = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        $q = Segment::where('tenant_id', $tid);
        if ($contactListId !== null) {
            $q->where('contact_list_id', $contactListId);
        }
        return $q->get();
    }

    public function createSegment(array $data, $tid = null): Segment
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return Segment::create($data);
    }

    public function listEmailSequences($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return EmailSequence::where('tenant_id', $tid)->with('steps')->orderBy('name')->get();
    }

    public function createEmailSequence(array $data, $tid = null): EmailSequence
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return EmailSequence::create($data);
    }

    public function addSequenceStep(EmailSequence $seq, array $data): EmailSequenceStep
    {
        $data['email_sequence_id'] = $seq->id;
        $data['step_order'] = $data['step_order'] ?? ($seq->steps()->max('step_order') + 1);
        return EmailSequenceStep::create($data);
    }

    public function updateSequenceStep(EmailSequenceStep $step, array $data): EmailSequenceStep
    {
        $step->update($data);
        return $step->fresh();
    }

    /** Process a due sequence step (send or queue next step). */
    public function processDueStep(EmailSequenceStep $step): void
    {
        $sequence = $step->emailSequence;
        if (! $sequence) {
            return;
        }
        // Stub: send step via SendEmailJob if action_type is 'send'; otherwise queue next step with delay
        $nextStep = EmailSequenceStep::where('email_sequence_id', $sequence->id)
            ->where('step_order', '>', $step->step_order)
            ->orderBy('step_order')
            ->first();
        if ($nextStep && $nextStep->delay_minutes > 0) {
            RunEmailSequenceStepJob::dispatch($nextStep->id)->delay(now()->addMinutes($nextStep->delay_minutes));
        } elseif ($nextStep) {
            RunEmailSequenceStepJob::dispatch($nextStep->id);
        }
    }
}
