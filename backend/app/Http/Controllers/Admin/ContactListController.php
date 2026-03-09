<?php

namespace App\Http\Controllers\Admin;

use App\Models\ContactList;
use App\Services\EmailAutomationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactListController extends BaseController
{
    public function index(Request $request, EmailAutomationService $service): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        $items = $service->listContactLists($tenantId);
        return response()->json(['data' => $items]);
    }

    public function store(Request $request, EmailAutomationService $service): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'source' => 'nullable|string|max:100',
            'is_dynamic' => 'nullable|boolean',
        ]);
        $validated['is_dynamic'] = $validated['is_dynamic'] ?? false;
        $tenantId = $this->getTenantId($request);
        $list = $service->createContactList($validated, $tenantId);
        return response()->json(['data' => $list], 201);
    }

    public function show(Request $request, ContactList $contactList): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $contactList->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Contact list not found or access denied.'], 404);
        }
        $contactList->load('segments');
        return response()->json(['data' => $contactList]);
    }

    public function update(Request $request, ContactList $contactList, EmailAutomationService $service): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $contactList->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Contact list not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'source' => 'nullable|string|max:100',
            'is_dynamic' => 'nullable|boolean',
        ]);
        $list = $service->updateContactList($contactList, $validated);
        return response()->json(['data' => $list]);
    }

    public function destroy(Request $request, ContactList $contactList): JsonResponse
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null && (int) $contactList->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Contact list not found or access denied.'], 404);
        }
        $contactList->delete();
        return response()->noContent();
    }
}
