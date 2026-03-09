<?php

namespace App\Http\Controllers\Admin;

use App\Models\ContentCalendarItem;
use App\Models\Campaign;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentCalendarController extends BaseController
{
    private function scopeByTenant($query, Request $request)
    {
        $tenantId = $this->getTenantId($request);
        if ($tenantId === null) {
            return $query;
        }
        return $query->where(function ($q) use ($tenantId) {
            $q->where(function ($q2) use ($tenantId) {
                $q2->whereNull('project_id')
                    ->orWhereHas('project', fn ($p) => $p->where('tenant_id', $tenantId));
            })->where(function ($q2) use ($tenantId) {
                $q2->whereNull('campaign_id')
                    ->orWhereHas('campaign', fn ($c) => $c->where('tenant_id', $tenantId));
            });
        });
    }

    private function findItem(int $id, Request $request): ?ContentCalendarItem
    {
        $query = ContentCalendarItem::where('id', $id);
        $query = $this->scopeByTenant($query, $request);
        return $query->first();
    }

    public function index(Request $request): JsonResponse
    {
        $query = ContentCalendarItem::with(['project:id,name,tenant_id', 'campaign:id,name,tenant_id', 'influencer:id,name'])
            ->orderBy('scheduled_date')->orderBy('id');
        $query = $this->scopeByTenant($query, $request);
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        if ($request->filled('campaign_id')) {
            $query->where('campaign_id', $request->campaign_id);
        }
        if ($request->filled('from_date')) {
            $query->where('scheduled_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->where('scheduled_date', '<=', $request->to_date);
        }
        $items = $request->boolean('paginate', true)
            ? $query->paginate($request->get('per_page', 15))
            : $query->get();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'campaign_id' => 'nullable|exists:campaigns,id',
            'scheduled_date' => 'required|date',
            'content_type' => 'nullable|string|max:30',
            'title' => 'nullable|string|max:255',
            'raw_content' => 'nullable|string',
            'status' => 'nullable|string|max:30',
            'influencer_id' => 'nullable|exists:influencers,id',
        ]);
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null) {
            if (! empty($validated['project_id']) && ! Project::where('id', $validated['project_id'])->where('tenant_id', $tenantId)->exists()) {
                return response()->json(['message' => 'Project not found or access denied.'], 404);
            }
            if (! empty($validated['campaign_id']) && ! Campaign::where('id', $validated['campaign_id'])->where('tenant_id', $tenantId)->exists()) {
                return response()->json(['message' => 'Campaign not found or access denied.'], 404);
            }
        }
        $validated['status'] = $validated['status'] ?? 'draft';
        $item = ContentCalendarItem::create($validated);
        return response()->json($item->load(['project', 'campaign', 'influencer']), 201);
    }

    public function show(Request $request, ContentCalendarItem $contentCalendarItem): JsonResponse
    {
        $item = $this->findItem($contentCalendarItem->id, $request);
        if (! $item) {
            return response()->json(['message' => 'Content calendar item not found or access denied.'], 404);
        }
        $item->load(['project', 'campaign', 'influencer']);
        return response()->json($item);
    }

    public function update(Request $request, ContentCalendarItem $contentCalendarItem): JsonResponse
    {
        $item = $this->findItem($contentCalendarItem->id, $request);
        if (! $item) {
            return response()->json(['message' => 'Content calendar item not found or access denied.'], 404);
        }
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'campaign_id' => 'nullable|exists:campaigns,id',
            'scheduled_date' => 'sometimes|date',
            'content_type' => 'nullable|string|max:30',
            'title' => 'nullable|string|max:255',
            'raw_content' => 'nullable|string',
            'status' => 'nullable|string|max:30',
            'influencer_id' => 'nullable|exists:influencers,id',
        ]);
        $tenantId = $this->getTenantId($request);
        if ($tenantId !== null) {
            if (! empty($validated['project_id']) && ! Project::where('id', $validated['project_id'])->where('tenant_id', $tenantId)->exists()) {
                return response()->json(['message' => 'Project not found or access denied.'], 404);
            }
            if (! empty($validated['campaign_id']) && ! Campaign::where('id', $validated['campaign_id'])->where('tenant_id', $tenantId)->exists()) {
                return response()->json(['message' => 'Campaign not found or access denied.'], 404);
            }
        }
        $item->update($validated);
        return response()->json($item->fresh(['project', 'campaign', 'influencer']));
    }

    public function destroy(Request $request, ContentCalendarItem $contentCalendarItem): JsonResponse
    {
        $item = $this->findItem($contentCalendarItem->id, $request);
        if (! $item) {
            return response()->json(['message' => 'Content calendar item not found or access denied.'], 404);
        }
        $item->delete();
        return response()->json(['message' => 'Content calendar item deleted']);
    }
}
