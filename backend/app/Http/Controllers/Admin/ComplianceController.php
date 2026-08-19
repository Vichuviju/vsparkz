<?php

namespace App\Http\Controllers\Admin;

use App\Models\ActivityAudit;
use App\Models\DataExportLog;
use App\Models\GdprConsent;
use App\Models\NdaDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplianceController extends BaseController
{
    /**
     * GET /admin/compliance/audit-logs
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $query = ActivityAudit::with(['user:id,name,email'])->orderBy('created_at', 'desc');
        $query = $this->applyTenantScope($query);
        $logs = $query->paginate(50);
        return response()->json($logs);
    }

    /**
     * GET /admin/compliance/ndas
     */
    public function ndas(Request $request): JsonResponse
    {
        $query = NdaDocument::with(['client:id,name'])->orderBy('created_at', 'desc');
        $query = $this->applyTenantScope($query);
        $ndas = $query->paginate(50);
        return response()->json($ndas);
    }

    /**
     * GET /admin/compliance/gdpr
     */
    public function gdprConsents(Request $request): JsonResponse
    {
        $query = GdprConsent::orderBy('created_at', 'desc');
        $query = $this->applyTenantScope($query);
        $consents = $query->paginate(50);
        return response()->json($consents);
    }

    /**
     * GET /admin/compliance/exports
     */
    public function exportLogs(Request $request): JsonResponse
    {
        $query = DataExportLog::with(['initiatedBy:id,name,email'])->orderBy('created_at', 'desc');
        $query = $this->applyTenantScope($query);
        $exports = $query->paginate(50);
        return response()->json($exports);
    }

    /**
     * POST /admin/compliance/export
     */
    public function triggerExport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'export_type' => 'required|string|max:50',
            'entity_type' => 'required|string|max:100',
        ]);

        $user = $request->user();
        $tenantId = $this->getTenantId($request);

        // Generate data export entry
        $log = DataExportLog::create([
            'tenant_id' => $tenantId,
            'initiated_by' => $user->id,
            'export_type' => $validated['export_type'],
            'entity_type' => $validated['entity_type'],
            'entity_ids_json' => [],
            'status' => 'completed',
            'generated_at' => now(),
            'downloaded_at' => null,
        ]);

        // Also add an audit log entry for this export action
        ActivityAudit::create([
            'tenant_id' => $tenantId,
            'user_id' => $user->id,
            'action' => 'data_export',
            'auditable_type' => DataExportLog::class,
            'auditable_id' => $log->id,
            'metadata_json' => ['export_type' => $validated['export_type'], 'entity_type' => $validated['entity_type']],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'occurred_at' => now(),
        ]);

        return response()->json([
            'message' => 'Export generated successfully.',
            'export' => $log,
        ]);
    }
}
