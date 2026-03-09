<?php

namespace App\Http\Controllers\Admin\Platform;

use App\Http\Controllers\Controller;
use App\Models\Role;

abstract class PlatformBaseController extends Controller
{
    protected function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Super admin only.');
        }
    }
}
