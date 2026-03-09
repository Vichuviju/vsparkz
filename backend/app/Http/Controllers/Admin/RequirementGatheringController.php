<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RequirementDocument;
use App\Models\RequirementGathering;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RequirementGatheringController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RequirementGathering::with(['client:id,company_name', 'project:id,name']);
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        $items = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'integer|exists:services,id',
            'expectations' => 'nullable|string',
            'selected_requirements' => 'nullable|array',
        ]);
        $item = RequirementGathering::create($validated);
        return response()->json($item->load(['client:id,company_name', 'project:id,name']), 201);
    }

    public function show(RequirementGathering $requirementGathering): JsonResponse
    {
        $requirementGathering->load(['client', 'project', 'documents.media']);
        return response()->json($requirementGathering);
    }

    public function update(Request $request, RequirementGathering $requirementGathering): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'integer|exists:services,id',
            'expectations' => 'nullable|string',
            'selected_requirements' => 'nullable|array',
        ]);
        $requirementGathering->update($validated);
        return response()->json($requirementGathering->fresh(['client', 'project', 'documents']));
    }

    public function destroy(RequirementGathering $requirementGathering): JsonResponse
    {
        $requirementGathering->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function storeDocument(Request $request, RequirementGathering $requirementGathering): JsonResponse
    {
        $request->validate(['file' => 'required|file|max:51200']); // 50MB
        $file = $request->file('file');
        $path = $file->store('requirement-documents', 'public');
        $doc = RequirementDocument::create([
            'requirement_gathering_id' => $requirementGathering->id,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
        ]);
        return response()->json($doc->fresh(), 201);
    }

    public function destroyDocument(RequirementGathering $requirementGathering, RequirementDocument $document): JsonResponse
    {
        if ((int) $document->requirement_gathering_id !== (int) $requirementGathering->id) {
            abort(404);
        }
        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }
        $document->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
