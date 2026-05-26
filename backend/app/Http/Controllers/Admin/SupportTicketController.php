<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::query()
            ->forTenant()
            ->with(['client:id,company_name', 'assignee:id,name', 'creator:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $tickets = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));
        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'subject' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'message' => 'required|string',
        ]);

        $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
        
        $ticket = SupportTicket::create([
            'tenant_id' => $tid,
            'client_id' => $validated['client_id'],
            'user_id' => auth()->id(),
            'subject' => $validated['subject'],
            'priority' => $validated['priority'],
            'status' => 'open',
        ]);

        TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'message' => $validated['message'],
        ]);

        return response()->json($ticket->load(['client', 'creator']), 201);
    }

    public function show(SupportTicket $supportTicket): JsonResponse
    {
        $supportTicket->load(['client', 'assignee', 'creator', 'replies.user:id,name']);
        return response()->json($supportTicket);
    }

    public function update(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:open,in_progress,resolved,closed',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $supportTicket->update($validated);
        return response()->json($supportTicket->load(['client', 'assignee', 'creator']));
    }

    public function reply(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        $reply = TicketReply::create([
            'ticket_id' => $supportTicket->id,
            'user_id' => auth()->id(),
            'message' => $validated['message'],
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        return response()->json($reply->load('user:id,name'), 201);
    }

    public function destroy(SupportTicket $supportTicket): JsonResponse
    {
        $supportTicket->delete();
        return response()->json(['message' => 'Ticket deleted']);
    }
}
