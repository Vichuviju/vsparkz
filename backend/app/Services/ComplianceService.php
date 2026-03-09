<?php

namespace App\Services;

use App\Models\ActivityAudit;
use App\Models\RoleAccessAudit;
use App\Models\NdaDocument;
use App\Models\GdprConsent;
use App\Models\DataExportLog;
use App\Models\DataRetentionPolicy;

class ComplianceService
{
    public function logActivity($action, $auditableType = null, $auditableId = null, array $meta = [], $tid = null): ActivityAudit
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return ActivityAudit::create([
            'tenant_id' => $tid, 'user_id' => auth()->id(), 'action' => $action,
            'auditable_type' => $auditableType, 'auditable_id' => $auditableId,
            'metadata_json' => $meta, 'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(), 'occurred_at' => now(),
        ]);
    }

    public function logRoleAccessChange($userId, $roleId, $changeType, $performedBy = null, $tid = null): RoleAccessAudit
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return RoleAccessAudit::create([
            'tenant_id' => $tid, 'user_id' => $userId, 'role_id' => $roleId,
            'performed_by' => $performedBy ?: auth()->id(), 'change_type' => $changeType, 'occurred_at' => now(),
        ]);
    }

    public function createNdaDocument(array $data, $tid = null): NdaDocument
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        return NdaDocument::create($data);
    }

    public function recordGdprConsent(array $data, $tid = null): GdprConsent
    {
        $data['tenant_id'] = $tid ?: auth()->user()?->tenant_id;
        $data['granted_at'] = $data['granted_at'] ?? now();
        return GdprConsent::create($data);
    }

    public function logDataExport($exportType, $entityType = null, $entityIds = null, $tid = null): DataExportLog
    {
        $tid = $tid ?: auth()->user()?->tenant_id;
        return DataExportLog::create([
            'tenant_id' => $tid, 'initiated_by' => auth()->id(), 'export_type' => $exportType,
            'entity_type' => $entityType, 'entity_ids_json' => $entityIds, 'status' => 'pending',
        ]);
    }

    public function createDataRetentionPolicy(array $data, $tid = null): DataRetentionPolicy
    {
        $data['tenant_id'] = $data['tenant_id'] ?? $tid ?? auth()->user()?->tenant_id;
        return DataRetentionPolicy::create($data);
    }
}
