<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Freelancer;
use App\Models\FreelancerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FreelancerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Freelancer::where('is_active', true);
        $items = $query->orderBy('name')->paginate($request->get('per_page', 20));
        return response()->json($items);
    }

    public function show(Freelancer $freelancer): JsonResponse
    {
        if (! $freelancer->is_active) {
            abort(404);
        }
        $freelancer->load(['ratings'])->loadCount('ratings');
        return response()->json($freelancer);
    }

    /** Assign freelancer with advance payment: create project + advance invoice (client must be logged in). */
    public function assignWithAdvance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'freelancer_id' => 'required|exists:freelancers,id',
            'title' => 'required|string|max:255',
            'advance_amount' => 'required|numeric|min:0.01',
        ]);
        $user = $request->user();
        if (! $user || $user->effective_role !== 'client') {
            return response()->json(['message' => 'Client login required'], 403);
        }
        $client = \App\Models\Client::where('user_id', $user->id)->orWhere('email', $user->email)->first();
        if (! $client) {
            return response()->json(['message' => 'Client record not found'], 403);
        }
        $freelancer = Freelancer::findOrFail($validated['freelancer_id']);
        if (! $freelancer->is_active) {
            return response()->json(['message' => 'Freelancer not available'], 422);
        }
        $project = \App\Models\Project::create([
            'client_id' => $client->id,
            'name' => $validated['title'],
            'freelancer_id' => $freelancer->id,
        ]);
        $invoice = \App\Models\Invoice::create([
            'client_id' => $client->id,
            'number' => 'INV-ADV-' . $project->id . '-' . now()->format('Ymd'),
            'total' => $validated['advance_amount'],
            'subtotal' => $validated['advance_amount'],
            'tax_rate' => 0,
            'tax_amount' => 0,
            'status' => 'sent',
            'invoice_type' => 'advance',
            'milestone_label' => 'Advance for project',
        ]);
        return response()->json([
            'message' => 'Project and advance invoice created',
            'project_id' => $project->id,
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->number,
            'amount' => (float) $invoice->total,
        ], 201);
    }

    public function requestCallback(Request $request): JsonResponse
    {
        $v = $request->validate([
            'freelancer_id' => 'required|exists:freelancers,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:50',
            'work_details' => 'nullable|string',
        ]);
        FreelancerRequest::create($v);
        return response()->json(['message' => 'Request submitted'], 201);
    }
}
