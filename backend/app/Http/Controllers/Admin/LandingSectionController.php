<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingSection;
use App\Models\LandingTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandingSectionController extends Controller
{
    public function index(LandingTemplate $template): JsonResponse
    {
        $sections = $template->sections()
            ->with(['blocks' => fn ($q) => $q->orderBy('sort_order'), 'blocks.media'])
            ->orderBy('sort_order')
            ->get();
        return response()->json($sections);
    }

    public function store(Request $request, LandingTemplate $template): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'layout_variant' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);
        $validated['landing_template_id'] = $template->id;
        $validated['layout_variant'] = $validated['layout_variant'] ?? 'default';
        $validated['sort_order'] = $validated['sort_order'] ?? ($template->sections()->max('sort_order') + 1);
        $validated['is_active'] = $validated['is_active'] ?? true;
        $section = LandingSection::create($validated);
        return response()->json($section->load('blocks'), 201);
    }

    public function update(Request $request, LandingSection $section): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|string|max:50',
            'layout_variant' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);
        $section->update($validated);
        return response()->json($section->fresh(['blocks.media']));
    }

    public function destroy(LandingSection $section): JsonResponse
    {
        $section->delete();
        return response()->json(['message' => 'Section deleted']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_ids' => 'required|array',
            'section_ids.*' => 'integer|exists:landing_sections,id',
        ]);
        foreach ($validated['section_ids'] as $order => $id) {
            LandingSection::where('id', $id)->update(['sort_order' => $order]);
        }
        return response()->json(['message' => 'Sections reordered']);
    }
}
