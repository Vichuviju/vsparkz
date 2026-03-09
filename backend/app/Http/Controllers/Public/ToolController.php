<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ToolController extends Controller
{
    public function seoAnalyze(Request $request): JsonResponse
    {
        $url = $request->input('url');
        if (! $url || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return response()->json(['error' => 'Valid URL required'], 422);
        }
        $user = $request->user();
        if ($user) {
            $used = DB::table('tool_usage')->where('user_id', $user->id)->where('tool_name', 'seo_analyzer')->count();
            if ($used >= 1) {
                return response()->json([
                    'error' => 'Free use limit reached',
                    'requires_subscription' => true,
                    'message' => 'Monthly subscription required for more analyses.',
                ], 403);
            }
            DB::table('tool_usage')->insert([
                'user_id' => $user->id,
                'tool_name' => 'seo_analyzer',
                'used_at' => now(),
            ]);
        }
        $meta = @get_meta_tags($url);
        $title = $meta['title'] ?? null;
        $description = $meta['description'] ?? null;
        $score = 50;
        if ($title) {
            $score += min(25, strlen($title) / 2);
        }
        if ($description) {
            $score += min(25, strlen($description) / 4);
        }
        $score = min(100, (int) $score);
        return response()->json([
            'url' => $url,
            'title' => $title,
            'description' => $description,
            'score' => $score,
            'used_free' => (bool) $user,
        ]);
    }

    /** Meta (Facebook) page analyzer – 1 free use per user. POST /tools/meta-analyze */
    public function metaAnalyze(Request $request): JsonResponse
    {
        $url = $request->input('page_url');
        if (! $url || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return response()->json(['error' => 'Valid page URL required'], 422);
        }
        $user = $request->user();
        if ($user) {
            $used = DB::table('tool_usage')->where('user_id', $user->id)->where('tool_name', 'meta_page_analyzer')->count();
            if ($used >= 1) {
                return response()->json([
                    'error' => 'Free use limit reached',
                    'requires_subscription' => true,
                    'message' => 'Monthly subscription required for more analyses.',
                ], 403);
            }
            DB::table('tool_usage')->insert([
                'user_id' => $user->id,
                'tool_name' => 'meta_page_analyzer',
                'used_at' => now(),
            ]);
        }
        // Placeholder: in production would use Meta Graph API with token
        $score = 60;
        return response()->json([
            'page_url' => $url,
            'page_name' => 'Sample Page',
            'followers_estimate' => null,
            'engagement_estimate' => null,
            'score' => $score,
            'recommendations' => ['Connect Meta Business account for live data.', 'Ensure page has clear CTA and consistent posting.'],
            'used_free' => (bool) $user,
        ]);
    }

    /** Strategy planner – 1 free use per user. POST /tools/strategy-planner */
    public function strategyPlanner(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'business_type' => 'required|string|max:100',
            'goals' => 'nullable|string|max:500',
            'budget' => 'nullable|string|max:50',
        ]);
        $user = $request->user();
        if ($user) {
            $used = DB::table('tool_usage')->where('user_id', $user->id)->where('tool_name', 'strategy_planner')->count();
            if ($used >= 1) {
                return response()->json([
                    'error' => 'Free use limit reached',
                    'requires_subscription' => true,
                    'message' => 'Monthly subscription required for more plans.',
                ], 403);
            }
            DB::table('tool_usage')->insert([
                'user_id' => $user->id,
                'tool_name' => 'strategy_planner',
                'used_at' => now(),
            ]);
        }
        $goals = $validated['goals'] ?? 'Grow awareness and leads';
        $budget = $validated['budget'] ?? 'Not specified';
        return response()->json([
            'business_type' => $validated['business_type'],
            'goals' => $goals,
            'budget' => $budget,
            'phases' => [
                ['phase' => 1, 'name' => 'Audit & baseline', 'duration' => '2 weeks', 'actions' => ['Competitor review', 'Current channel audit', 'KPI baseline']],
                ['phase' => 2, 'name' => 'Strategy & content', 'duration' => '4 weeks', 'actions' => ['Content pillars', 'Channel mix', 'Content calendar draft']],
                ['phase' => 3, 'name' => 'Launch & optimize', 'duration' => 'Ongoing', 'actions' => ['Campaign launch', 'A/B tests', 'Monthly reporting']],
            ],
            'used_free' => (bool) $user,
        ]);
    }
}
