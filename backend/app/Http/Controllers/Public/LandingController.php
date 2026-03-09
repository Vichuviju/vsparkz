<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LandingTemplate;
use App\Models\Media;
use Illuminate\Http\JsonResponse;

class LandingController extends Controller
{
    /**
     * Get active landing template with ordered sections and blocks (for public website).
     */
    public function show(): JsonResponse
    {
        $template = LandingTemplate::getActive();
        if (! $template) {
            return response()->json([
                'template' => null,
                'sections' => [],
                'message' => 'No active landing template.',
            ], 200);
        }

        $template->load([
            'sections' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'sections.blocks' => fn ($q) => $q->orderBy('sort_order'),
            'sections.blocks.media',
        ]);

        return response()->json([
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'description' => $template->description,
                'layout_style' => $template->layout_style,
                'animation_defaults' => $template->animation_defaults,
            ],
            'sections' => $template->sections->map(function ($section) {
                $settings = $section->settings ?? [];
                $backgroundUrl = null;
                if (! empty($settings['background_media_id'])) {
                    $media = Media::find($settings['background_media_id']);
                    if ($media) {
                        $backgroundUrl = $media->url ?? \Storage::disk($media->disk ?? 'public')->url($media->path);
                    }
                }
                return [
                'id' => $section->id,
                'type' => $section->type,
                'layout_variant' => $section->layout_variant,
                'settings' => $settings,
                'background_image_url' => $backgroundUrl,
                'blocks' => $section->blocks->map(fn ($block) => [
                    'id' => $block->id,
                    'type' => $block->type,
                    'content' => $block->content,
                    'media' => $block->media ? [
                        'id' => $block->media->id,
                        'url' => $block->media->url ?? \Storage::disk($block->media->disk ?? 'public')->url($block->media->path),
                        'filename' => $block->media->filename,
                        'alt' => $block->content['alt'] ?? $block->media->filename,
                    ] : null,
                    'aspect_ratio' => $block->aspect_ratio,
                    'alignment' => $block->alignment,
                    'object_fit' => $block->object_fit,
                    'animation_config' => $block->animation_config,
                ])->values()->all(),
            ];
            })->values()->all(),
        ]);
    }
}
