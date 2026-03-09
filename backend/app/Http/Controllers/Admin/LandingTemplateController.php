<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandingTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = LandingTemplate::withCount('sections')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
        return response()->json($templates);
    }

    public function show(LandingTemplate $template): JsonResponse
    {
        $template->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.blocks' => fn ($q) => $q->orderBy('sort_order'),
            'sections.blocks.media',
        ]);
        return response()->json($template);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:50|unique:landing_templates,slug',
            'description' => 'nullable|string|max:255',
            'layout_style' => 'nullable|array',
            'animation_defaults' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $validated['sort_order'] = $validated['sort_order'] ?? (LandingTemplate::max('sort_order') ?? 0) + 1;
        $validated['is_active'] = $validated['is_active'] ?? false;
        $template = LandingTemplate::create($validated);
        return response()->json($template, 201);
    }

    public function update(Request $request, LandingTemplate $template): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'slug' => 'sometimes|string|max:50|unique:landing_templates,slug,' . $template->id,
            'description' => 'nullable|string|max:255',
            'layout_style' => 'nullable|array',
            'animation_defaults' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $template->update($validated);
        return response()->json($template->fresh());
    }

    public function destroy(LandingTemplate $template): JsonResponse
    {
        $template->delete();
        return response()->json(['message' => 'Template deleted']);
    }

    /**
     * Set this template as the active one (only one active for public).
     */
    public function activate(LandingTemplate $template): JsonResponse
    {
        LandingTemplate::where('id', '!=', $template->id)->update(['is_active' => false]);
        $template->update(['is_active' => true]);
        return response()->json(['message' => 'Template activated', 'template' => $template->fresh()]);
    }
}
