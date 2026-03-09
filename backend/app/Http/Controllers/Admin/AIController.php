<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    public function strategySuggestions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'context' => 'nullable|string|max:2000',
            'business_type' => 'nullable|string|max:100',
        ]);
        $suggestions = $this->callOrDemo('strategy', $validated, [
            'suggestions' => [
                'Focus on 2-3 core channels in the first 90 days.',
                'Set up baseline KPIs before scaling spend.',
                'Consider influencer micro-campaigns for awareness.',
            ],
        ]);
        return response()->json($suggestions);
    }

    public function seoRecommendations(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'nullable|string|max:500',
            'keywords' => 'nullable|string|max:500',
        ]);
        $result = $this->callOrDemo('seo', $validated, [
            'recommendations' => [
                'Improve meta title length (50-60 chars).',
                'Add internal links to key service pages.',
                'Target one primary keyword per page.',
            ],
        ]);
        return response()->json($result);
    }

    public function keywordPlanner(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seed_keyword' => 'required|string|max:100',
            'niche' => 'nullable|string|max:100',
        ]);
        $result = $this->callOrDemo('keywords', $validated, [
            'keywords' => [
                ['keyword' => $validated['seed_keyword'], 'volume' => 'medium', 'difficulty' => 'medium'],
                ['keyword' => $validated['seed_keyword'] . ' services', 'volume' => 'low', 'difficulty' => 'low'],
                ['keyword' => 'best ' . $validated['seed_keyword'], 'volume' => 'high', 'difficulty' => 'high'],
            ],
        ]);
        return response()->json($result);
    }

    public function contentIdeas(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string|max:200',
            'count' => 'nullable|integer|min:1|max:20',
        ]);
        $count = $validated['count'] ?? 5;
        $result = $this->callOrDemo('content', $validated, [
            'ideas' => [
                'How to get started with ' . $validated['topic'],
                '5 tips for ' . $validated['topic'],
                'Case study: ' . $validated['topic'],
                'Common mistakes in ' . $validated['topic'],
                'Tools and resources for ' . $validated['topic'],
            ],
        ]);
        if (isset($result['ideas']) && count($result['ideas']) > $count) {
            $result['ideas'] = array_slice($result['ideas'], 0, $count);
        }
        return response()->json($result);
    }

    public function captionGeneration(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string|max:200',
            'tone' => 'nullable|string|in:professional,casual,urgent',
            'platform' => 'nullable|string|max:50',
        ]);
        $result = $this->callOrDemo('caption', $validated, [
            'caption' => 'Discover how ' . $validated['topic'] . ' can help you reach your goals. Link in bio.',
            'hashtags' => ['#growth', '#strategy', '#marketing'],
        ]);
        return response()->json($result);
    }

    private function callOrDemo(string $type, array $input, array $demoResponse): array
    {
        $key = config('services.openai.api_key') ?: config('services.gemini.api_key');
        if ($key && config('services.openai.api_key')) {
            try {
                $response = Http::withToken($key)
                    ->timeout(15)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-3.5-turbo',
                        'messages' => [
                            ['role' => 'user', 'content' => json_encode(['type' => $type, 'input' => $input])],
                        ],
                        'max_tokens' => 500,
                    ]);
                if ($response->successful() && ($data = $response->json()) && isset($data['choices'][0]['message']['content'])) {
                    $content = json_decode($data['choices'][0]['message']['content'], true);
                    return is_array($content) ? $content : array_merge($demoResponse, ['ai_note' => $data['choices'][0]['message']['content']]);
                }
            } catch (\Throwable $e) {
                return array_merge($demoResponse, ['ai_error' => 'AI request failed', 'demo' => true]);
            }
        }
        return array_merge($demoResponse, ['demo' => true]);
    }
}
