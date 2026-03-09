<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_STAFF = 'staff';
    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_AGENCY_ADMIN = 'agency_admin';
    public const ROLE_AGENCY_STAFF = 'agency_staff';
    public const ROLE_FREELANCER = 'freelancer';
    public const ROLE_INFLUENCER = 'influencer';
    public const ROLE_CLIENT = 'client';
    public const ROLE_PROJECT_MANAGER = 'project_manager';
    public const ROLE_EMPLOYEE = 'employee';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'tenant_id',
        'agency_id', // alias for tenant_id (redirected in mutator; no DB column after evolve)
        'client_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /** Read: agency_id is an alias for tenant_id (column was renamed in evolve migration). */
    public function getAgencyIdAttribute(): mixed
    {
        return $this->attributes['tenant_id'] ?? null;
    }

    /** Write: set agency_id on the model actually sets tenant_id so SQL uses tenant_id. */
    public function setAgencyIdAttribute(mixed $value): void
    {
        $this->attributes['tenant_id'] = $value;
        unset($this->attributes['agency_id']);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles()->where('slug', $slug)->exists();
    }

    public function hasPermission(string $slug): bool
    {
        foreach ($this->roles as $role) {
            if ($role->permissions()->where('slug', $slug)->exists()) {
                return true;
            }
        }
        return false;
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /** Effective role for API: first role slug or fallback to role column. */
    public function getEffectiveRoleAttribute(): string
    {
        $role = $this->roles()->first();
        return $role?->slug ?? $this->role ?? 'client';
    }

    public function isSuperAdmin(): bool
    {
        return $this->effective_role === self::ROLE_SUPER_ADMIN
            || $this->hasRole(Role::SLUG_SUPER_ADMIN);
    }
}
