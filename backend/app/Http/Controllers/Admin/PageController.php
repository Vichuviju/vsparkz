<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function index(): JsonResponse
    {
        $pages = Page::orderBy('slug')->get();
        return response()->json($pages);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'required|string|max:255|unique:pages,slug',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string',
            'og_image' => 'nullable|string|max:255',
            'is_published' => 'nullable|boolean',
        ]);
        $page = Page::create($validated);
        return response()->json($page, 201);
    }

    public function show(Page $page): JsonResponse
    {
        $page->load(['sections.blocks.media']);
        return response()->json($page);
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'sometimes|string|max:255|unique:pages,slug,' . $page->id,
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string',
            'og_image' => 'nullable|string|max:255',
            'is_published' => 'nullable|boolean',
        ]);
        $page->update($validated);
        return response()->json($page->fresh());
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();
        return response()->json(['message' => 'Page deleted']);
    }
}
