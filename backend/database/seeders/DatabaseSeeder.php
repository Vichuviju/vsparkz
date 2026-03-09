<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Order: roles -> agencies -> users -> services/pricing -> CRM/sales -> people -> content.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@vsparkzdigital.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]
        );

        $this->call([
            RoleAndPermissionSeeder::class,
            SubscriptionPlanSeeder::class,
            AgencySeeder::class,
            TenantSeeder::class,
            SubscriptionSeeder::class,
            UserSeeder::class,
            ServiceSeeder::class,
            SubServiceSeeder::class,
            PricingLevelSeeder::class,
            ServicePriceSeeder::class,
            ComboPackageSeeder::class,
            PlanSeeder::class,
            LeadSeeder::class,
            ClientSeeder::class,
            ProjectSeeder::class,
            RequirementGatheringSeeder::class,
            StrategyReportSeeder::class,
            QuotationSeeder::class,
            AgreementSeeder::class,
            InvoiceSeeder::class,
            PaymentSeeder::class,
            FreelancerSeeder::class,
            InfluencerSeeder::class,
            CampaignSeeder::class,
            ReportSeeder::class,
            PageSeeder::class,
            SystemSettingSeeder::class,
        ]);
    }
}
