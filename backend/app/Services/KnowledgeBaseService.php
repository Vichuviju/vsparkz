<?php

namespace App\Services;

use App\Models\KnowledgeSpace;
use App\Models\KnowledgeArticle;
use App\Models\KnowledgeArticleVersion;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;

class KnowledgeBaseService
{
    public function listSpaces($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return KnowledgeSpace::where('tenant_id', $tid)->orderBy('name')->get();
    }

    public function createSpace(array $data, $tid = null): KnowledgeSpace
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return KnowledgeSpace::create($data);
    }

    public function updateSpace(KnowledgeSpace $s, array $data): KnowledgeSpace
    {
        $s->update($data);
        return $s->fresh();
    }

    public function createArticle(KnowledgeSpace $space, array $data): KnowledgeArticle
    {
        $data['knowledge_space_id'] = $space->id;
        return KnowledgeArticle::create($data);
    }

    public function updateArticle(KnowledgeArticle $a, array $data): KnowledgeArticle
    {
        $a->update($data);
        return $a->fresh();
    }

    public function createArticleVersion(KnowledgeArticle $a, array $data): KnowledgeArticleVersion
    {
        $data['knowledge_article_id'] = $a->id;
        $data['version'] = $data['version'] ?? ($a->versions()->max('version') + 1);
        $data['changed_at'] = $data['changed_at'] ?? now();
        return KnowledgeArticleVersion::create($data);
    }

    public function listTrainingModules($tid = null)
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return TrainingModule::where('tenant_id', $tid)->orderBy('title')->get();
    }

    public function createTrainingModule(array $data, $tid = null): TrainingModule
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return TrainingModule::create($data);
    }

    public function recordTrainingProgress(TrainingModule $m, int $userId, array $data): TrainingProgress
    {
        $data['training_module_id'] = $m->id;
        $data['user_id'] = $userId;
        return TrainingProgress::updateOrCreate(['training_module_id' => $m->id, 'user_id' => $userId], $data);
    }
}
