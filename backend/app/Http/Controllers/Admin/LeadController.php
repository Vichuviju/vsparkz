<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\ClientPortalInvite;
use App\Models\Client;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\LeadStatusHistory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class LeadController extends Controller
{
    private const VALID_STATUSES = ['new', 'contacted', 'rejected', 'hold', 'follow_back', 'closed', 'converted'];

    public function index(Request $request): JsonResponse
    {
        $query = Lead::query()->forTenant()->with(['service:id,title', 'assignedTo:id,name,email']);
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }
        if ($request->filled('lead_source')) {
            $query->where('lead_source', $request->lead_source);
        }
        if ($request->filled('do_not_call')) {
            $query->where('do_not_call', (bool) $request->do_not_call);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('company', 'like', "%{$q}%");
            });
        }
        $leads = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));
        return response()->json($leads);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'service_id' => 'nullable|exists:services,id',
            'subject' => 'nullable|string|max:255',
            'message' => 'nullable|string',
            'status' => 'nullable|in:' . implode(',', self::VALID_STATUSES),
            'source' => 'nullable|string|max:100',
        ]);
        if (! auth()->user()->isSuperAdmin()) {
            $validated['tenant_id'] = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        }
        $lead = Lead::create($validated);
        $lead->load('service:id,title', 'assignedTo:id,name,email');
        return response()->json($lead, 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        $lead = Lead::forAgency()->findOrFail($lead->id);
        $lead->load([
            'service:id,title',
            'selectedComboPackage:id,name',
            'assignedTo:id,name,email',
            'statusHistory.user:id,name',
            'activities.user:id,name',
            'convertedToClient:id,company_name',
        ]);
        return response()->json($lead);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $lead = Lead::forAgency()->findOrFail($lead->id);
        $validated = $request->validate([
            'status' => 'sometimes|in:' . implode(',', self::VALID_STATUSES),
            'assigned_to' => 'nullable|integer|exists:users,id',
            'follow_up_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'status_note' => 'nullable|string|max:500',
            'lead_source' => 'nullable|string|max:100',
            'do_not_call' => 'nullable|boolean',
            'next_step' => 'nullable|string|max:80',
            'next_step_date' => 'nullable|date',
        ]);
        $statusNote = $validated['status_note'] ?? null;
        unset($validated['status_note']);
        $oldStatus = $lead->status;

        // When status is set to 'converted', ensure a client is created and linked (add to clients table)
        if (isset($validated['status']) && $validated['status'] === 'converted' && ! $lead->converted_to_client_id) {
            $clientData = [
                'company_name' => $lead->company ?: $lead->name,
                'contact_name' => $lead->name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'address' => null,
                'lead_id' => $lead->id,
                'source' => $lead->lead_source ?: $lead->source ?: 'lead_conversion',
            ];
            if (! auth()->user()->isSuperAdmin()) {
                $clientData['tenant_id'] = auth()->user()->tenant_id ?? auth()->user()->agency_id;
            }
            $client = Client::create($clientData);
            $validated['converted_to_client_id'] = $client->id;
            if (empty($statusNote)) {
                $statusNote = 'Converted to client #' . $client->id;
            }
        }

        $lead->update($validated);
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            LeadStatusHistory::create([
                'lead_id' => $lead->id,
                'from_status' => $oldStatus,
                'to_status' => $validated['status'],
                'user_id' => $request->user()?->id,
                'notes' => $statusNote,
            ]);
        }
        return response()->json($lead->fresh(['service:id,title', 'assignedTo:id,name,email', 'statusHistory.user:id,name', 'convertedToClient:id,company_name']));
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead = Lead::forAgency()->findOrFail($lead->id);
        $lead->delete();
        return response()->json(['message' => 'Lead deleted']);
    }

    public function convertToClient(Request $request, Lead $lead): JsonResponse
    {
        $lead = Lead::forAgency()->findOrFail($lead->id);
        if ($lead->converted_to_client_id) {
            return response()->json(['message' => 'Lead already converted'], 422);
        }
        $validated = $request->validate([
            'next_step' => 'nullable|string|max:80',
            'next_step_date' => 'nullable|date',
            'create_login' => 'nullable|boolean',
            'send_invite_email' => 'nullable|boolean',
        ]);
        $createLogin = $validated['create_login'] ?? true;
        $sendInviteEmail = $validated['send_invite_email'] ?? true;
        $oldStatus = $lead->status;

        $client = DB::transaction(function () use ($lead, $validated, $oldStatus, $request, $createLogin, $sendInviteEmail) {
            $clientData = [
                'company_name' => $lead->company ?: $lead->name,
                'contact_name' => $lead->name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'address' => null,
                'lead_id' => $lead->id,
                'source' => $lead->lead_source ?: $lead->source ?: 'lead_conversion',
            ];
            if (! auth()->user()->isSuperAdmin()) {
                $clientData['tenant_id'] = auth()->user()->tenant_id ?? auth()->user()->agency_id;
            }
            $client = Client::create($clientData);

            $lead->update([
                'converted_to_client_id' => $client->id,
                'status' => 'converted',
                'next_step' => $validated['next_step'] ?? null,
                'next_step_date' => $validated['next_step_date'] ?? null,
            ]);

            LeadStatusHistory::create([
                'lead_id' => $lead->id,
                'from_status' => $oldStatus,
                'to_status' => 'converted',
                'user_id' => $request->user()?->id,
                'notes' => 'Converted to client #' . $client->id,
            ]);

            if ($createLogin && ! empty(trim((string) $lead->email))) {
                $user = User::where('email', $lead->email)->first();
                if ($user) {
                    $user->update(['client_id' => $client->id]);
                    $client->update(['user_id' => $user->id]);
                    if ($sendInviteEmail) {
                        $this->sendClientInviteEmail($lead->email, $lead->name ?: $client->company_name, null);
                    }
                } else {
                    $temporaryPassword = Str::random(12);
                    $user = User::create([
                        'name' => $lead->name ?: $client->company_name,
                        'email' => $lead->email,
                        'password' => Hash::make($temporaryPassword),
                        'role' => User::ROLE_CLIENT,
                        'client_id' => $client->id,
                    ]);
                    $role = Role::where('slug', 'client')->first();
                    if ($role) {
                        $user->roles()->sync([$role->id]);
                    }
                    $client->update(['user_id' => $user->id]);
                    if ($sendInviteEmail) {
                        $this->sendClientInviteEmail($lead->email, $lead->name ?: $client->company_name, $temporaryPassword);
                    }
                }
            }

            return $client;
        });

        return response()->json([
            'client' => $client->fresh(['user:id,name,email']),
            'lead' => $lead->fresh(['service:id,title', 'assignedTo:id,name,email', 'convertedToClient:id,company_name']),
        ], 201);
    }

    private function sendClientInviteEmail(string $email, string $clientName, ?string $temporaryPassword): void
    {
        try {
            $loginUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/') . '/login';
            Mail::to($email)->send(new ClientPortalInvite($clientName, $email, $temporaryPassword, $loginUrl));
        } catch (Throwable $e) {
            Log::warning('Client portal invite email failed', ['email' => $email, 'message' => $e->getMessage()]);
        }
    }

    public function activities(Lead $lead): JsonResponse
    {
        $lead = Lead::forAgency()->findOrFail($lead->id);
        $items = $lead->activities()->with('user:id,name')->orderByDesc('created_at')->get();
        return response()->json($items);
    }

    public function storeActivity(Request $request, Lead $lead): JsonResponse
    {
        $lead = Lead::forAgency()->findOrFail($lead->id);
        $validated = $request->validate([
            'type' => 'required|string|in:call,comment,email',
            'content' => 'nullable|string',
        ]);
        $validated['lead_id'] = $lead->id;
        $validated['user_id'] = $request->user()?->id;
        $activity = LeadActivity::create($validated);
        return response()->json($activity->load('user:id,name'), 201);
    }
}
