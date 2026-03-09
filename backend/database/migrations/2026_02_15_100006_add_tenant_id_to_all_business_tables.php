<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function addTenantId(string $table, bool $nullable = true): void
    {
        Schema::table($table, function (Blueprint $t) use ($nullable): void {
            $t->foreignId('tenant_id')->nullable($nullable)->after('id')->constrained('tenants')->nullOnDelete();
        });
    }

    public function up(): void
    {
        $tables = [
            'quotations',
            'agreements',
            'invoices',
            'campaigns',
            'reports',
            'requirement_templates',
            'requirement_gatherings',
            'strategy_reports',
            'offer_documents',
            'services',
            'sub_services',
            'pricing_levels',
            'combo_packages',
            'service_prices',
            'freelancer_master_pricing',
            'project_assignments',
            'time_logs',
            'pages',
            'page_sections',
            'page_blocks',
            'landing_templates',
            'landing_sections',
            'landing_blocks',
            'media',
            'influencers',
            'settings',
        ];
        if (Schema::hasTable('requirement_documents')) {
            $tables[] = 'requirement_documents';
        }

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'tenant_id')) {
                $this->addTenantId($table);
            }
        }

        if (Schema::hasTable('payments') && !Schema::hasColumn('payments', 'tenant_id')) {
            Schema::table('payments', function (Blueprint $t): void {
                $t->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->nullOnDelete();
            });
        }

        if (Schema::hasTable('tasks') && !Schema::hasColumn('tasks', 'tenant_id')) {
            $this->addTenantId('tasks');
        }
        if (Schema::hasTable('leaves') && !Schema::hasColumn('leaves', 'tenant_id')) {
            $this->addTenantId('leaves');
        }
        if (Schema::hasTable('quotation_services') && !Schema::hasColumn('quotation_services', 'tenant_id')) {
            $this->addTenantId('quotation_services');
        }
        if (Schema::hasTable('project_tasks') && !Schema::hasColumn('project_tasks', 'tenant_id')) {
            $this->addTenantId('project_tasks');
        }
        if (Schema::hasTable('task_updates') && !Schema::hasColumn('task_updates', 'tenant_id')) {
            $this->addTenantId('task_updates');
        }
        if (Schema::hasTable('combo_package_items') && !Schema::hasColumn('combo_package_items', 'tenant_id')) {
            $this->addTenantId('combo_package_items');
        }

        $firstTenantId = DB::table('tenants')->min('id');
        if (!$firstTenantId) {
            return;
        }

        if (Schema::hasTable('quotations') && Schema::hasColumn('quotations', 'client_id')) {
            DB::table('quotations')->whereNotNull('client_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM clients WHERE clients.id = quotations.client_id)'),
            ]);
        }
        if (Schema::hasTable('agreements') && Schema::hasColumn('agreements', 'client_id')) {
            DB::table('agreements')->whereNotNull('client_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM clients WHERE clients.id = agreements.client_id)'),
            ]);
        }
        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'client_id')) {
            DB::table('invoices')->whereNotNull('client_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM clients WHERE clients.id = invoices.client_id)'),
            ]);
        }
        if (Schema::hasTable('project_assignments') && Schema::hasColumn('project_assignments', 'project_id')) {
            DB::table('project_assignments')->whereNotNull('project_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM projects WHERE projects.id = project_assignments.project_id)'),
            ]);
        }
        if (Schema::hasTable('time_logs') && Schema::hasColumn('time_logs', 'user_id')) {
            DB::table('time_logs')->whereNotNull('user_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM users WHERE users.id = time_logs.user_id)'),
            ]);
        }
        foreach (['services', 'sub_services', 'combo_packages', 'pricing_levels', 'offer_documents', 'pages', 'landing_templates', 'campaigns', 'reports', 'requirement_templates', 'requirement_gatherings', 'strategy_reports', 'media', 'influencers', 'settings'] as $t) {
            if (Schema::hasTable($t) && Schema::hasColumn($t, 'tenant_id')) {
                DB::table($t)->whereNull('tenant_id')->update(['tenant_id' => $firstTenantId]);
            }
        }
        if (Schema::hasTable('page_sections') && Schema::hasColumn('page_sections', 'page_id')) {
            DB::table('page_sections')->whereNotNull('page_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM pages WHERE pages.id = page_sections.page_id)'),
            ]);
        }
        if (Schema::hasTable('page_blocks') && Schema::hasColumn('page_blocks', 'tenant_id')) {
            DB::table('page_blocks')->whereNull('tenant_id')->update(['tenant_id' => $firstTenantId]);
        }
        if (Schema::hasTable('landing_sections') && Schema::hasColumn('landing_sections', 'landing_template_id')) {
            DB::table('landing_sections')->whereNotNull('landing_template_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM landing_templates WHERE landing_templates.id = landing_sections.landing_template_id)'),
            ]);
        }
        if (Schema::hasTable('landing_blocks') && Schema::hasColumn('landing_blocks', 'tenant_id')) {
            DB::table('landing_blocks')->whereNull('tenant_id')->update(['tenant_id' => $firstTenantId]);
        }
        if (Schema::hasTable('service_prices') && Schema::hasColumn('service_prices', 'tenant_id')) {
            DB::table('service_prices')->whereNull('tenant_id')->update(['tenant_id' => $firstTenantId]);
        }
        if (Schema::hasTable('combo_package_items') && Schema::hasColumn('combo_package_items', 'combo_package_id')) {
            DB::table('combo_package_items')->whereNotNull('combo_package_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM combo_packages WHERE combo_packages.id = combo_package_items.combo_package_id)'),
            ]);
        }
        if (Schema::hasTable('project_tasks') && Schema::hasColumn('project_tasks', 'project_id')) {
            DB::table('project_tasks')->whereNotNull('project_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM projects WHERE projects.id = project_tasks.project_id)'),
            ]);
        }
        if (Schema::hasTable('quotation_services') && Schema::hasColumn('quotation_services', 'quotation_id')) {
            DB::table('quotation_services')->whereNotNull('quotation_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM quotations WHERE quotations.id = quotation_services.quotation_id)'),
            ]);
        }
        if (Schema::hasTable('requirement_documents') && Schema::hasColumn('requirement_documents', 'tenant_id') && Schema::hasColumn('requirement_documents', 'requirement_gathering_id')) {
            DB::table('requirement_documents')->whereNotNull('requirement_gathering_id')->update([
                'tenant_id' => DB::raw('(SELECT tenant_id FROM requirement_gatherings WHERE requirement_gatherings.id = requirement_documents.requirement_gathering_id)'),
            ]);
        }
    }

    public function down(): void
    {
        $tables = [
            'quotation_services', 'task_updates', 'combo_package_items', 'project_tasks',
            'quotations', 'agreements', 'invoices', 'campaigns', 'reports', 'requirement_templates',
            'requirement_gatherings', 'strategy_reports', 'offer_documents', 'services', 'sub_services',
            'pricing_levels', 'combo_packages', 'service_prices', 'freelancer_master_pricing',
            'project_assignments', 'time_logs', 'pages', 'page_sections', 'page_blocks',
            'landing_templates', 'landing_sections', 'landing_blocks', 'media', 'influencers', 'settings',
            'tasks', 'leaves', 'payments',
        ];
        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'tenant_id')) {
                Schema::table($table, fn (Blueprint $t) => $t->dropConstrainedForeignId('tenant_id'));
            }
        }
        if (Schema::hasTable('requirement_documents') && Schema::hasColumn('requirement_documents', 'tenant_id')) {
            Schema::table('requirement_documents', fn (Blueprint $t) => $t->dropConstrainedForeignId('tenant_id'));
        }
    }
};
