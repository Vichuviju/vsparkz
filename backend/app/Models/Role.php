<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = ['name', 'slug'];

    public const SLUG_SUPER_ADMIN = 'super_admin';
    public const SLUG_AGENCY_ADMIN = 'agency_admin';
    public const SLUG_AGENCY_STAFF = 'agency_staff';
    public const SLUG_FREELANCER = 'freelancer';
    public const SLUG_INFLUENCER = 'influencer';
    public const SLUG_CLIENT = 'client';
    /** @deprecated use SLUG_SUPER_ADMIN or SLUG_AGENCY_ADMIN */
    public const SLUG_ADMIN = 'admin';
    public const SLUG_STAFF = 'staff';
    public const SLUG_PROJECT_MANAGER = 'project_manager';
    public const SLUG_EMPLOYEE = 'employee';

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user');
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role');
    }
}
