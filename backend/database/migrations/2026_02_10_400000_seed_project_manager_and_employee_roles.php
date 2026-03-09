<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roles = [
            ['name' => 'Project Manager', 'slug' => 'project_manager', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Employee', 'slug' => 'employee', 'created_at' => now(), 'updated_at' => now()],
        ];
        foreach ($roles as $role) {
            if (DB::table('roles')->where('slug', $role['slug'])->doesntExist()) {
                DB::table('roles')->insert($role);
            }
        }
    }

    public function down(): void
    {
        DB::table('roles')->whereIn('slug', ['project_manager', 'employee'])->delete();
    }
};
