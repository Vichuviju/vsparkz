<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingBlock;
use App\Models\LandingSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandingBlockController extends Controller
{
    public function index(LandingSection $section): JsonResponse
    {
        $blocks = $section->blocks()->with('media')->orderBy('sort_order')->get();
        return response()->json($blocks);
    }

    public function store(Request $request, LandingSection $section): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'content' => 'nullable|array',
            'media_id' => 'nullable|integer|exists:media,id',
            'aspect_ratio' => 'nullable|string|max:20',
            'alignment' => 'nullable|string|max:20',
            'object_fit' => 'nullable|string|max:20',
            'animation_config' => 'nullable|array',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $validated['landing_section_id'] = $section->id;
        $validated['sort_order'] = $validated['sort_order'] ?? ($section->blocks()->max('sort_order') + 1);
        $block = LandingBlock::create($validated);
        return response()->json($block->load('media'), 201);
    }

    public function update(Request $request, LandingBlock $block): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|string|max:50',
            'content' => 'nullable|array',
            'media_id' => 'nullable|integer|exists:media,id',
            'aspect_ratio' => 'nullable|string|max:20',
            'alignment' => 'nullable|string|max:20',
            'object_fit' => 'nullable|string|max:20',
            'animation_config' => 'nullable|array',
            'sort_order' => 'nullable|integer|min:0',
        ]);
        $block->update($validated);
        return response()->json($block->fresh('media'));
    }

    public function destroy(LandingBlock $block): JsonResponse
    {
        $block->delete();
        return response()->json(['message' => 'Block deleted']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'block_ids' => 'required|array',
            'block_ids.*' => 'integer|exists:landing_blocks,id',
        ]);
        foreach ($validated['block_ids'] as $order => $id) {
            LandingBlock::where('id', $id)->update(['sort_order' => $order]);
        }
        return response()->json(['message' => 'Blocks reordered']);
    }
}
