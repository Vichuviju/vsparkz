<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageBlock;
use App\Models\PageSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageBlockController extends Controller
{
    public function index(PageSection $section): JsonResponse
    {
        $blocks = $section->blocks()->with('media')->orderBy('sort_order')->get();
        return response()->json($blocks);
    }

    public function store(Request $request, PageSection $section): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'content' => 'nullable|array',
            'media_id' => 'nullable|integer|exists:media,id',
            'aspect_ratio' => 'nullable|string|max:20',
            'animation_settings' => 'nullable|array',
            'cta_config' => 'nullable|array',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $validated['page_section_id'] = $section->id;
        $validated['sort_order'] = $validated['sort_order'] ?? ($section->blocks()->max('sort_order') + 1);
        $block = PageBlock::create($validated);
        return response()->json($block->load('media'), 201);
    }

    public function update(Request $request, PageBlock $block): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|string|max:50',
            'content' => 'nullable|array',
            'media_id' => 'nullable|integer|exists:media,id',
            'aspect_ratio' => 'nullable|string|max:20',
            'animation_settings' => 'nullable|array',
            'cta_config' => 'nullable|array',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $block->update($validated);
        return response()->json($block->fresh('media'));
    }

    public function destroy(PageBlock $block): JsonResponse
    {
        $block->delete();
        return response()->json(['message' => 'Block deleted']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'block_ids' => 'required|array',
            'block_ids.*' => 'integer|exists:page_blocks,id',
        ]);
        foreach ($validated['block_ids'] as $order => $id) {
            PageBlock::where('id', $id)->update(['sort_order' => $order]);
        }
        return response()->json(['message' => 'Blocks reordered']);
    }
}
