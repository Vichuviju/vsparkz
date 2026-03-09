<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\PageSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageSectionController extends Controller
{
    public function index(Page $page): JsonResponse
    {
        $sections = $page->sections()->with('blocks.media')->orderBy('sort_order')->get();
        return response()->json($sections);
    }

    public function store(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'layout' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_visible' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);
        $validated['page_id'] = $page->id;
        $validated['layout'] = $validated['layout'] ?? 'default';
        $validated['sort_order'] = $validated['sort_order'] ?? ($page->sections()->max('sort_order') + 1);
        $validated['is_visible'] = $validated['is_visible'] ?? true;
        $section = PageSection::create($validated);
        return response()->json($section->load('blocks'), 201);
    }

    public function update(Request $request, PageSection $section): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|string|max:50',
            'layout' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_visible' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);
        $section->update($validated);
        return response()->json($section->fresh(['blocks.media']));
    }

    public function destroy(PageSection $section): JsonResponse
    {
        $section->delete();
        return response()->json(['message' => 'Section deleted']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_ids' => 'required|array',
            'section_ids.*' => 'integer|exists:page_sections,id',
        ]);
        foreach ($validated['section_ids'] as $order => $id) {
            PageSection::where('id', $id)->update(['sort_order' => $order]);
        }
        return response()->json(['message' => 'Sections reordered']);
    }
}
