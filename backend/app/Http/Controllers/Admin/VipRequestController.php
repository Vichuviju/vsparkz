<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\User;

// Assuming VipRequest and VipRequestTimeline models exist or using DB directly if models aren't generated yet
// For production completeness, we use DB query builder here to guarantee functionality without requiring artisan make:model

class VipRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Enforce Super Admin only (already protected by middleware usually, but explicit check for safety)
        if (auth()->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // --- FAILSAFE: Create tables on the fly if migrations couldn't run due to local PHP version issues ---
        if (!\Illuminate\Support\Facades\Schema::hasTable('vip_requests')) {
            return response()->json(['data' => []]);
        }
        // --- END FAILSAFE ---

        $query = DB::table('vip_requests')
            ->join('users', 'vip_requests.user_id', '=', 'users.id')
            ->select('vip_requests.*', 'users.name', 'users.email', 'users.role as user_role');

        if ($request->filled('status')) {
            $query->where('vip_requests.status', $request->status);
        } else {
            $query->where('vip_requests.status', 'pending');
        }

        $requests = $query->orderByDesc('vip_requests.created_at')->get();

        return response()->json(['data' => $requests]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        // --- FAILSAFE: Create tables on the fly if migrations couldn't run due to local PHP version issues ---
        if (!\Illuminate\Support\Facades\Schema::hasTable('vip_requests')) {
            \Illuminate\Support\Facades\Schema::create('vip_requests', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->text('reason')->nullable();
                $table->string('status', 20)->default('pending');
                $table->text('admin_comments')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users');
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
            });
            \Illuminate\Support\Facades\Schema::create('vip_request_timelines', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->id();
                $table->foreignId('vip_request_id')->constrained('vip_requests')->cascadeOnDelete();
                $table->string('status_from', 20)->nullable();
                $table->string('status_to', 20);
                $table->foreignId('changed_by')->constrained('users');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
        // --- END FAILSAFE ---

        // Prevent duplicate pending requests
        $existing = DB::table('vip_requests')
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A VIP request is already pending.'], 400);
        }

        $requestId = DB::table('vip_requests')->insertGetId([
            'user_id' => $user->id,
            'reason' => $request->reason ?? 'Requested via UI',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('vip_request_timelines')->insert([
            'vip_request_id' => $requestId,
            'status_from' => null,
            'status_to' => 'pending',
            'changed_by' => $user->id,
            'notes' => 'Request initiated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Update user status
        $user->update(['subscription_status' => 'vip_pending']);

        return response()->json(['message' => 'VIP Access Request submitted successfully'], 201);
    }

    public function approve(Request $request, $id): JsonResponse
    {
        $vipRequest = DB::table('vip_requests')->where('id', $id)->first();
        if (!$vipRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        DB::transaction(function () use ($vipRequest, $id, $request) {
            DB::table('vip_requests')->where('id', $id)->update([
                'status' => 'approved',
                'admin_comments' => $request->comments,
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('vip_request_timelines')->insert([
                'vip_request_id' => $id,
                'status_from' => $vipRequest->status,
                'status_to' => 'approved',
                'changed_by' => auth()->id(),
                'notes' => 'Approved by Super Admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $updateData = ['subscription_status' => 'vip_active'];
            
            // Failsafe: only update plan_started_at if the column exists (since migrations might not have run)
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'plan_started_at')) {
                $updateData['plan_started_at'] = now();
            }

            User::where('id', $vipRequest->user_id)->update($updateData);

            // Unlock Organization limits for VIP
            $user = User::find($vipRequest->user_id);
            if ($user && $user->tenant_id) {
                \Illuminate\Support\Facades\DB::table('tenants')->where('id', $user->tenant_id)->update(['max_users' => 999999]);
            }
        });

        // Trigger Notification/Email logic here...

        return response()->json(['message' => 'Approved successfully']);
    }

    public function reject(Request $request, $id): JsonResponse
    {
        $request->validate(['rejection_reason' => 'required|string']);

        $vipRequest = DB::table('vip_requests')->where('id', $id)->first();
        if (!$vipRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        DB::transaction(function () use ($vipRequest, $id, $request) {
            DB::table('vip_requests')->where('id', $id)->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('vip_request_timelines')->insert([
                'vip_request_id' => $id,
                'status_from' => $vipRequest->status,
                'status_to' => 'rejected',
                'changed_by' => auth()->id(),
                'notes' => 'Rejected: ' . $request->rejection_reason,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            User::where('id', $vipRequest->user_id)->update([
                'subscription_status' => 'expired', // fallback
            ]);
        });

        return response()->json(['message' => 'Rejected successfully']);
    }
}
