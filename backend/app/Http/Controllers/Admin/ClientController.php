<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\SaaSQuotaExceededException;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::query()->forTenant()->orderBy('company_name');
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('company_name', 'like', "%{$q}%")
                    ->orWhere('contact_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }
        $clients = $query->paginate($request->get('per_page', 15));
        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'lead_id' => 'nullable|exists:leads,id',
            'source' => 'nullable|string|max:100',
            'user_id' => 'nullable|exists:users,id',
        ]);
        $user = auth()->user();
        if (! $user->isSuperAdmin()) {
            $validated['tenant_id'] = $user->tenant_id ?? $user->agency_id;
            $tenant = Tenant::find($validated['tenant_id']);
            if ($tenant && $tenant->max_clients !== null && $tenant->clients()->count() >= $tenant->max_clients) {
                throw new SaaSQuotaExceededException('Client limit reached for your plan. Please upgrade.');
            }
        }
        $client = Client::create($validated);
        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        $client = Client::forAgency()->findOrFail($client->id);
        $client->load(['lead:id,name,email,source', 'projects', 'quotations', 'invoices'])->loadCount(['projects', 'invoices']);
        return response()->json($client);
    }

    /** Full client profile for admin: company, projects, agreements, invoices, reports, change history placeholder. */
    public function profile(Client $client): JsonResponse
    {
        $client->load([
            'lead:id,name,email,source',
            'user:id,name,email',
            'projects' => fn ($q) => $q->orderByDesc('updated_at'),
            'quotations' => fn ($q) => $q->orderByDesc('created_at')->limit(10),
            'invoices' => fn ($q) => $q->with('payments')->orderByDesc('created_at')->limit(20),
            'agreements' => fn ($q) => $q->orderByDesc('created_at'),
            'strategyReports' => fn ($q) => $q->orderByDesc('created_at')->limit(10),
        ]);
        $client->loadCount(['projects', 'invoices']);
        $payload = $client->toArray();
        $payload['activity_log'] = []; // Placeholder: add client_activity_log table and sync later
        $payload['upcoming_process'] = []; // Placeholder: next appointments / tasks
        return response()->json($payload);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $client = Client::forAgency()->findOrFail($client->id);
        $validated = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'lead_id' => 'nullable|exists:leads,id',
            'source' => 'nullable|string|max:100',
            'user_id' => 'nullable|exists:users,id',
        ]);
        $client->update($validated);
        return response()->json($client->fresh());
    }

    public function destroy(Client $client): JsonResponse
    {
        $client = Client::forAgency()->findOrFail($client->id);
        $client->delete();
        return response()->json(['message' => 'Client deleted']);
    }
}
