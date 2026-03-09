<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $agencies = Agency::all();
        $superAdminRole = Role::where('slug', Role::SLUG_SUPER_ADMIN)->first();
        $agencyAdminRole = Role::where('slug', Role::SLUG_AGENCY_ADMIN)->first();
        $agencyStaffRole = Role::where('slug', Role::SLUG_AGENCY_STAFF)->first();

        $admin = User::updateOrCreate(
            ['email' => 'admin@vsparkzdigital.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
                'role' => 'super_admin',
                'agency_id' => null,
            ]
        );
        if ($superAdminRole && ! $admin->roles()->where('slug', Role::SLUG_SUPER_ADMIN)->exists()) {
            $admin->roles()->attach($superAdminRole->id);
        }

        foreach ($agencies as $agency) {
            $agencyAdmin = User::updateOrCreate(
                ['email' => 'agency' . $agency->id . '@vsparkzdigital.com'],
                [
                    'name' => $agency->name . ' Admin',
                    'password' => bcrypt('password'),
                    'role' => 'agency_admin',
                    'agency_id' => $agency->id,
                ]
            );
            if ($agencyAdminRole && ! $agencyAdmin->roles()->where('slug', Role::SLUG_AGENCY_ADMIN)->exists()) {
                $agencyAdmin->roles()->syncWithoutDetaching([$agencyAdminRole->id]);
            }

            $staff = User::updateOrCreate(
                ['email' => 'staff' . $agency->id . '@vsparkzdigital.com'],
                [
                    'name' => $agency->name . ' Staff',
                    'password' => bcrypt('password'),
                    'role' => 'agency_staff',
                    'agency_id' => $agency->id,
                ]
            );
            if ($agencyStaffRole && ! $staff->roles()->where('slug', Role::SLUG_AGENCY_STAFF)->exists()) {
                $staff->roles()->syncWithoutDetaching([$agencyStaffRole->id]);
            }
        }
    }
}
