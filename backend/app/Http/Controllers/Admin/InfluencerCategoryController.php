<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InfluencerCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfluencerCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = InfluencerCategory::query()->orderBy('name')->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $category = InfluencerCategory::create($validated);
        return response()->json($category, 201);
    }

    public function update(Request $request, InfluencerCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $category->update($validated);
        return response()->json($category);
    }

    public function destroy(InfluencerCategory $category): JsonResponse
    {
        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }
}
