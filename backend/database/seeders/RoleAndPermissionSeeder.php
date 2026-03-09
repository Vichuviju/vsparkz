<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Seed roles and permissions per PRD; assign super_admin to default admin.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => Role::SLUG_SUPER_ADMIN],
            ['name' => 'Agency Admin', 'slug' => Role::SLUG_AGENCY_ADMIN],
            ['name' => 'Agency Staff', 'slug' => Role::SLUG_AGENCY_STAFF],
            ['name' => 'Freelancer', 'slug' => Role::SLUG_FREELANCER],
            ['name' => 'Influencer', 'slug' => Role::SLUG_INFLUENCER],
            ['name' => 'Client', 'slug' => Role::SLUG_CLIENT],
            ['name' => 'Admin', 'slug' => Role::SLUG_ADMIN],
            ['name' => 'Staff', 'slug' => Role::SLUG_STAFF],
            ['name' => 'Project Manager', 'slug' => Role::SLUG_PROJECT_MANAGER],
            ['name' => 'Employee', 'slug' => Role::SLUG_EMPLOYEE],
        ];
        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }

        $permissions = [
            ['name' => 'View leads', 'slug' => 'leads.view'],
            ['name' => 'Manage leads', 'slug' => 'leads.manage'],
            ['name' => 'View clients', 'slug' => 'clients.view'],
            ['name' => 'Manage clients', 'slug' => 'clients.manage'],
            ['name' => 'View projects', 'slug' => 'projects.view'],
            ['name' => 'Manage projects', 'slug' => 'projects.manage'],
            ['name' => 'View invoices', 'slug' => 'invoices.view'],
            ['name' => 'Manage invoices', 'slug' => 'invoices.create'],
            ['name' => 'Manage pages', 'slug' => 'pages.manage'],
            ['name' => 'Manage services', 'slug' => 'services.manage'],
            ['name' => 'Manage campaigns', 'slug' => 'campaigns.manage'],
            ['name' => 'Manage settings', 'slug' => 'settings.manage'],
            ['name' => 'Manage users', 'slug' => 'users.manage'],
            ['name' => 'Manage influencers', 'slug' => 'influencers.manage'],
            ['name' => 'Manage freelancers', 'slug' => 'freelancers.manage'],
            ['name' => 'View reports', 'slug' => 'reports.view'],
            ['name' => 'Manage reports', 'slug' => 'reports.manage'],
            ['name' => 'Manage quotations', 'slug' => 'quotations.manage'],
            ['name' => 'Manage agreements', 'slug' => 'agreements.manage'],
            ['name' => 'Manage master config', 'slug' => 'master.manage'],
            ['name' => 'Manage agencies', 'slug' => 'agencies.manage'],
        ];
        foreach ($permissions as $perm) {
            Permission::updateOrCreate(['slug' => $perm['slug']], $perm);
        }

        $superAdmin = Role::where('slug', Role::SLUG_SUPER_ADMIN)->first();
        $adminRole = Role::where('slug', Role::SLUG_ADMIN)->first();
        if ($superAdmin) {
            $superAdmin->permissions()->sync(Permission::pluck('id'));
        }
        if ($adminRole) {
            $adminRole->permissions()->sync(Permission::pluck('id'));
        }

        $agencyAdmin = Role::where('slug', Role::SLUG_AGENCY_ADMIN)->first();
        if ($agencyAdmin) {
            $agencyAdmin->permissions()->sync(Permission::whereIn('slug', [
                'leads.view', 'leads.manage', 'clients.view', 'clients.manage', 'projects.view', 'projects.manage',
                'invoices.view', 'invoices.create', 'reports.view', 'reports.manage', 'influencers.manage',
                'freelancers.manage', 'quotations.manage', 'agreements.manage', 'pages.manage', 'services.manage',
                'campaigns.manage', 'settings.manage',
            ])->pluck('id'));
        }

        $adminUser = User::where('email', 'admin@vsparkzdigital.com')->first();
        if ($adminUser && $superAdmin) {
            $adminUser->roles()->sync([$superAdmin->id]);
            $adminUser->update(['role' => 'super_admin']);
        }
    }
}
