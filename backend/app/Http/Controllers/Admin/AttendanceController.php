<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->toDateString());
        
        $attendances = DB::table('attendances')
            ->join('users', 'attendances.user_id', '=', 'users.id')
            ->select('attendances.*', 'users.name as employee_name', 'users.email')
            ->where('date', $date)
            ->get();
            
        // If empty, generate standard placeholders for all active users so frontend can show them as absent/pending
        if ($attendances->isEmpty()) {
            $users = User::where('is_active', true)->get();
            $placeholders = $users->map(function($u) use ($date) {
                return [
                    'id' => 'tmp_' . $u->id,
                    'user_id' => $u->id,
                    'employee_name' => $u->name,
                    'email' => $u->email,
                    'date' => $date,
                    'check_in' => null,
                    'check_out' => null,
                    'status' => 'absent',
                    'hours_worked' => 0
                ];
            });
            return response()->json(['data' => $placeholders]);
        }

        return response()->json(['data' => $attendances]);
    }

    public function syncBiometric(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'punches' => 'required|array',
            'punches.*.employee_id' => 'required',
            'punches.*.timestamp' => 'required|date',
            'punches.*.type' => 'required|in:in,out'
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['punches'] as $punch) {
                $date = \Carbon\Carbon::parse($punch['timestamp'])->toDateString();
                $time = \Carbon\Carbon::parse($punch['timestamp'])->toTimeString();
                
                // For simplicity, match user by ID (in reality, biometric systems use an internal employee_code)
                // We'll map employee_id directly to user_id here.
                $user = User::find($punch['employee_id']);
                if (!$user) continue;

                $attendance = DB::table('attendances')
                    ->where('user_id', $user->id)
                    ->where('date', $date)
                    ->first();

                if (!$attendance) {
                    $id = DB::table('attendances')->insertGetId([
                        'user_id' => $user->id,
                        'date' => $date,
                        'check_in' => $punch['type'] === 'in' ? $time : null,
                        'check_out' => $punch['type'] === 'out' ? $time : null,
                        'status' => 'present',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $updateData = [];
                    if ($punch['type'] === 'in' && !$attendance->check_in) {
                        $updateData['check_in'] = $time;
                    }
                    if ($punch['type'] === 'out') {
                        $updateData['check_out'] = $time;
                    }
                    
                    if (!empty($updateData)) {
                        $updateData['updated_at'] = now();
                        DB::table('attendances')->where('id', $attendance->id)->update($updateData);
                    }
                }
            }

            DB::table('biometric_sync_logs')->insert([
                'provider' => 'zkteco_rest',
                'status' => 'success',
                'records_synced' => count($validated['punches']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Biometric data synced successfully']);
    }
}
