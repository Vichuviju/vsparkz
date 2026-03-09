<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    /**
     * Get published page by slug with visible sections and blocks (for public website).
     */
    public function show(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('is_published', true)->firstOrFail();
        $page->load([
            'sections' => fn ($q) => $q->where('is_visible', true)->orderBy('sort_order'),
            'sections.blocks' => fn ($q) => $q->orderBy('sort_order'),
            'sections.blocks.media',
        ]);
        return response()->json($page);
    }
}
