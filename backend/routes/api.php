<?php

use App\Http\Controllers\Admin\AgencyController;
use App\Http\Controllers\Admin\AgreementController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\AIController;
use App\Http\Controllers\Admin\CampaignController;
use App\Http\Controllers\Admin\DealController;
use App\Http\Controllers\Admin\BrandingController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\ContactListController;
use App\Http\Controllers\Admin\FormController;
use App\Http\Controllers\Admin\KeywordController;
use App\Http\Controllers\Admin\KnowledgeSpaceController;
use App\Http\Controllers\Admin\OnboardingQuestionnaireController;
use App\Http\Controllers\Admin\ReportTemplateController;
use App\Http\Controllers\Admin\VendorController;
use App\Http\Controllers\Admin\WorkflowTemplateController;
use App\Http\Controllers\Admin\AutomationWorkflowController;
use App\Http\Controllers\Admin\ContentCalendarController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InfluencerController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\PageBlockController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\PageSectionController;
use App\Http\Controllers\Admin\InvoiceAdjustmentController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\LeaveController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\PayrollController;
use App\Http\Controllers\Admin\TaskController;
use App\Http\Controllers\Admin\TimeLogController;
use App\Http\Controllers\Admin\ProjectAssignmentController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\WorkDashboardController;
use App\Http\Controllers\Admin\ProjectTaskController;
use App\Http\Controllers\Admin\QuotationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SettingsApiController;
use App\Http\Controllers\Admin\SubServiceController;
use App\Http\Controllers\Admin\PricingLevelController;
use App\Http\Controllers\Admin\ServicePriceController;
use App\Http\Controllers\Admin\ComboPackageController;
use App\Http\Controllers\Admin\OfferDocumentController;
use App\Http\Controllers\Admin\RequirementTemplateController;
use App\Http\Controllers\Admin\RequirementGatheringController;
use App\Http\Controllers\Admin\StrategyReportController;
use App\Http\Controllers\Admin\FreelancerController;
use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Admin\LandingTemplateController;
use App\Http\Controllers\Admin\LandingSectionController;
use App\Http\Controllers\Admin\LandingBlockController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\SuperAdminController;
use App\Models\User;
use App\Http\Controllers\Public\LeadController as PublicLeadController;
use App\Http\Controllers\Public\InfluencerController as PublicInfluencerController;
use App\Http\Controllers\Public\PageController as PublicPageController;
use App\Http\Controllers\Public\LandingController as PublicLandingController;
use App\Http\Controllers\Public\SiteSettingsController as PublicSiteSettingsController;
use App\Http\Controllers\Public\FreelancerController as PublicFreelancerController;
use App\Http\Controllers\Public\OfferController as PublicOfferController;
use App\Http\Controllers\Public\OfferDocumentController as PublicOfferDocumentController;
use App\Http\Controllers\Public\ToolController as PublicToolController;
use App\Http\Controllers\Auth\OAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Vsparkz Digital (Public + Admin API)
|--------------------------------------------------------------------------
*/

// Health check (no DB) - GET /api/health to verify backend is up
Route::get('/health', function () {
    return response()->json(['ok' => true, 'message' => 'Vsparkz API']);
});

// Public: get published page by slug (block-based CMS)
Route::get('/pages/{slug}', [PublicPageController::class, 'show']);

// Public: active landing page (template + sections + blocks)
Route::get('/landing', [PublicLandingController::class, 'show']);

// Public: site settings (name, logo URL) for header/footer
Route::get('/site-settings', [PublicSiteSettingsController::class, 'show']);

// Public: offers (combo packages for pricing/offers page)
Route::get('/offers', [PublicOfferController::class, 'index']);
Route::get('/offers/{id}', [PublicOfferController::class, 'show']);
Route::post('/custom-package-preview', [PublicOfferController::class, 'customPackagePreview']);
Route::post('/custom-package-freelancers', [PublicOfferController::class, 'customPackageFreelancers']);
// Public: package generator / offer documents (multi-combo layout for services page)
Route::get('/offer-documents', [PublicOfferDocumentController::class, 'index']);
Route::get('/offer-documents/{id}', [PublicOfferDocumentController::class, 'show']);
// Public: services and sub-services for custom package builder (read-only, active only)
Route::get('/public/services', function () {
    return response()->json(\App\Models\Service::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get());
});
Route::get('/public/sub-services', function () {
    return response()->json(\App\Models\SubService::with('service')->where('is_active', true)->orderBy('sort_order')->orderBy('id')->get());
});

// Public: pricing plans and testimonials (for landing)
Route::get('/plans', function () {
    return response()->json(\App\Models\Plan::where('is_active', true)->orderBy('id')->get());
});
Route::get('/testimonials', function () {
    return response()->json(\App\Models\Testimonial::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get());
});

// Public forms (no auth) – tenant middleware resolves tenant for lead/influencer
Route::post('/leads', [PublicLeadController::class, 'store'])->middleware('tenant');
Route::post('/influencers', [PublicInfluencerController::class, 'store'])->middleware('tenant');

// Public freelancer listing and request
Route::get('/freelancers', [PublicFreelancerController::class, 'index']);
Route::get('/freelancers/{freelancer}', [PublicFreelancerController::class, 'show']);
Route::post('/freelancers/request-callback', [PublicFreelancerController::class, 'requestCallback']);
Route::post('/freelancers/assign-with-advance', [PublicFreelancerController::class, 'assignWithAdvance'])->middleware('auth:sanctum');

// Public tools (optional auth for free use tracking)
Route::post('/tools/seo-analyze', [PublicToolController::class, 'seoAnalyze']);
Route::post('/tools/meta-analyze', [PublicToolController::class, 'metaAnalyze']);
Route::post('/tools/strategy-planner', [PublicToolController::class, 'strategyPlanner']);

// Public auth
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Payment webhooks (no auth; verified by signature)
Route::post('/webhooks/razorpay', [WebhookController::class, 'razorpay']);
Route::post('/webhooks/stripe', [WebhookController::class, 'stripe']);

// OAuth (redirect to provider, then callback redirects to frontend with token)
Route::get('/auth/google', [OAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [OAuthController::class, 'handleGoogleCallback']);
Route::get('/auth/facebook', [OAuthController::class, 'redirectToFacebook']);
Route::get('/auth/facebook/callback', [OAuthController::class, 'handleFacebookCallback']);

// Client portal (auth + client role)
Route::middleware(['auth:sanctum', 'tenant', 'subscription'])->prefix('client')->group(function (): void {
    Route::get('invoices', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'invoices']);
    Route::get('reports', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'reports']);
    Route::get('projects', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'projects']);
    Route::get('projects/{project}', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'showProject']);
    Route::patch('projects/{project}', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'updateProject']);
    Route::get('quotations', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'quotations']);
    Route::get('quotations/{quotation}', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'showQuotation']);
    Route::patch('quotations/{quotation}', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'updateQuotation']);
    Route::get('quotations/{quotation}/pdf', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'quotationPdf']);
    Route::get('agreements', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'agreements']);
    Route::get('agreements/{agreement}', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'showAgreement']);
    Route::patch('agreements/{agreement}', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'updateAgreement']);
    Route::get('agreements/{agreement}/pdf', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'agreementPdf']);
    Route::post('agreements/{agreement}/approve', [\App\Http\Controllers\ClientPortal\ClientPortalController::class, 'approveAgreement']);
});

// Portal: freelancer / employee / project_manager – assigned projects, task updates, time logs
Route::middleware('auth:sanctum')->prefix('portal')->group(function (): void {
    Route::get('assigned-projects', [\App\Http\Controllers\Portal\AssignedProjectsController::class, 'index']);
    Route::get('assigned-projects/{project}', [\App\Http\Controllers\Portal\AssignedProjectsController::class, 'show']);
    Route::post('task-updates', [\App\Http\Controllers\Portal\AssignedProjectsController::class, 'storeTaskUpdate']);
    Route::patch('project-tasks/{task}', [\App\Http\Controllers\Portal\AssignedProjectsController::class, 'updateTask']);
    Route::get('time-logs', [\App\Http\Controllers\Portal\AssignedProjectsController::class, 'timeLogs']);
    Route::post('time-logs', [\App\Http\Controllers\Portal\AssignedProjectsController::class, 'storeTimeLog']);
});

// Protected admin routes (Sanctum token required)
Route::middleware(['auth:sanctum', 'tenant', 'subscription'])->prefix('admin')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard analytics
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Users list (for assignee pickers)
    Route::get('/users', function () {
        $query = User::select('id', 'name', 'email', 'tenant_id')->orderBy('name');
        if (auth()->check() && ! auth()->user()->isSuperAdmin()) {
            $tid = auth()->user()->tenant_id ?? auth()->user()->agency_id;
            if ($tid) $query->where('tenant_id', $tid);
        }
        return response()->json($query->get());
    });

    // Team / Users management (CRUD)
    Route::get('/team', [UserController::class, 'index']);
    Route::post('/team', [UserController::class, 'store']);
    Route::get('/team/{user}', [UserController::class, 'show']);
    Route::put('/team/{user}', [UserController::class, 'update']);
    Route::delete('/team/{user}', [UserController::class, 'destroy']);

    // Super Admin: dashboard, roles & permissions (super_admin only, 403 otherwise)
    Route::get('/super-admin/dashboard', [SuperAdminController::class, 'dashboard']);
    Route::get('/super-admin/users', [SuperAdminController::class, 'users']);
    Route::put('/super-admin/users/{user}', [SuperAdminController::class, 'updateUser']);
    Route::get('/roles-with-permissions', [RolePermissionController::class, 'index']);
    Route::get('/permissions', [RolePermissionController::class, 'permissions']);
    Route::put('/roles/{role}/permissions', [RolePermissionController::class, 'updatePermissions']);

    // Platform Admin (SaaS – super admin only)
    Route::prefix('platform')->group(function (): void {
        Route::get('analytics', [\App\Http\Controllers\Admin\Platform\PlatformAnalyticsController::class, 'index']);
        Route::get('tenants', [\App\Http\Controllers\Admin\Platform\TenantController::class, 'index']);
        Route::post('tenants', [\App\Http\Controllers\Admin\Platform\TenantController::class, 'store']);
        Route::get('tenants/{tenant}', [\App\Http\Controllers\Admin\Platform\TenantController::class, 'show']);
        Route::put('tenants/{tenant}', [\App\Http\Controllers\Admin\Platform\TenantController::class, 'update']);
        Route::delete('tenants/{tenant}', [\App\Http\Controllers\Admin\Platform\TenantController::class, 'destroy']);
        Route::get('tenants/{tenant}/usage', [\App\Http\Controllers\Admin\Platform\TenantUsageController::class, 'show']);
        Route::get('plans', [\App\Http\Controllers\Admin\Platform\PlanController::class, 'index']);
        Route::post('plans', [\App\Http\Controllers\Admin\Platform\PlanController::class, 'store']);
        Route::get('plans/{subscription_plan}', [\App\Http\Controllers\Admin\Platform\PlanController::class, 'show']);
        Route::put('plans/{subscription_plan}', [\App\Http\Controllers\Admin\Platform\PlanController::class, 'update']);
        Route::delete('plans/{subscription_plan}', [\App\Http\Controllers\Admin\Platform\PlanController::class, 'destroy']);
        Route::get('subscriptions', [\App\Http\Controllers\Admin\Platform\SubscriptionController::class, 'index']);
        Route::post('subscriptions', [\App\Http\Controllers\Admin\Platform\SubscriptionController::class, 'store']);
        Route::put('subscriptions/{subscription}', [\App\Http\Controllers\Admin\Platform\SubscriptionController::class, 'update']);
        Route::post('impersonate', [\App\Http\Controllers\Admin\Platform\ImpersonateController::class, 'store']);
    });

    // Lead management (mini CRM)
    Route::apiResource('leads', LeadController::class);
    Route::post('leads/{lead}/convert-to-client', [LeadController::class, 'convertToClient']);
    Route::get('leads/{lead}/activities', [LeadController::class, 'activities']);
    Route::post('leads/{lead}/activities', [LeadController::class, 'storeActivity']);

    // CMS: services, pages
    Route::apiResource('services', ServiceController::class);
    Route::get('sub-services', [SubServiceController::class, 'index']);
    Route::post('sub-services', [SubServiceController::class, 'store']);
    Route::get('sub-services/{subService}', [SubServiceController::class, 'show']);
    Route::put('sub-services/{subService}', [SubServiceController::class, 'update']);
    Route::delete('sub-services/{subService}', [SubServiceController::class, 'destroy']);
    Route::apiResource('pricing-levels', PricingLevelController::class);
    Route::get('service-prices', [ServicePriceController::class, 'index']);
    Route::post('service-prices', [ServicePriceController::class, 'store']);
    Route::get('service-prices/{servicePrice}', [ServicePriceController::class, 'show']);
    Route::put('service-prices/{servicePrice}', [ServicePriceController::class, 'update']);
    Route::delete('service-prices/{servicePrice}', [ServicePriceController::class, 'destroy']);
    Route::get('combo-packages', [ComboPackageController::class, 'index']);
    Route::post('combo-packages', [ComboPackageController::class, 'store']);
    Route::post('combo-packages/preview-calc', [ComboPackageController::class, 'previewCalculation']);
    Route::get('combo-packages/{comboPackage}/preview', [ComboPackageController::class, 'preview']);
    Route::get('combo-packages/{comboPackage}/pdf', [ComboPackageController::class, 'downloadPdf']);
    Route::post('combo-packages/{comboPackage}/generate-pdf', [ComboPackageController::class, 'generatePdf']);
    Route::get('combo-packages/{comboPackage}', [ComboPackageController::class, 'show']);
    Route::put('combo-packages/{comboPackage}', [ComboPackageController::class, 'update']);
    Route::delete('combo-packages/{comboPackage}', [ComboPackageController::class, 'destroy']);
    Route::get('offer-documents', [OfferDocumentController::class, 'index']);
    Route::post('offer-documents', [OfferDocumentController::class, 'store']);
    Route::get('offer-documents/{offerDocument}/preview', [OfferDocumentController::class, 'preview']);
    Route::get('offer-documents/{offerDocument}/pdf', [OfferDocumentController::class, 'downloadPdf']);
    Route::get('offer-documents/{offerDocument}', [OfferDocumentController::class, 'show']);
    Route::put('offer-documents/{offerDocument}', [OfferDocumentController::class, 'update']);
    Route::delete('offer-documents/{offerDocument}', [OfferDocumentController::class, 'destroy']);
    Route::apiResource('pages', PageController::class);

    // Block CMS: sections and blocks
    Route::get('pages/{page}/sections', [PageSectionController::class, 'index']);
    Route::post('pages/{page}/sections', [PageSectionController::class, 'store']);
    Route::put('page-sections/{section}', [PageSectionController::class, 'update']);
    Route::delete('page-sections/{section}', [PageSectionController::class, 'destroy']);
    Route::post('page-sections/reorder', [PageSectionController::class, 'reorder']);

    Route::get('page-sections/{section}/blocks', [PageBlockController::class, 'index']);
    Route::post('page-sections/{section}/blocks', [PageBlockController::class, 'store']);
    Route::put('page-blocks/{block}', [PageBlockController::class, 'update']);
    Route::delete('page-blocks/{block}', [PageBlockController::class, 'destroy']);
    Route::post('page-blocks/reorder', [PageBlockController::class, 'reorder']);

    // Media library
    Route::get('media', [MediaController::class, 'index']);
    Route::get('media/upload-limits', [MediaController::class, 'uploadLimits']);
    Route::post('media', [MediaController::class, 'store']);

    // Landing Page Builder
    Route::get('landing-templates', [LandingTemplateController::class, 'index']);
    Route::get('landing-templates/{template}', [LandingTemplateController::class, 'show']);
    Route::post('landing-templates', [LandingTemplateController::class, 'store']);
    Route::put('landing-templates/{template}', [LandingTemplateController::class, 'update']);
    Route::delete('landing-templates/{template}', [LandingTemplateController::class, 'destroy']);
    Route::post('landing-templates/{template}/activate', [LandingTemplateController::class, 'activate']);

    Route::get('landing-templates/{template}/sections', [LandingSectionController::class, 'index']);
    Route::post('landing-templates/{template}/sections', [LandingSectionController::class, 'store']);
    Route::put('landing-sections/{section}', [LandingSectionController::class, 'update']);
    Route::delete('landing-sections/{section}', [LandingSectionController::class, 'destroy']);
    Route::post('landing-sections/reorder', [LandingSectionController::class, 'reorder']);

    Route::get('landing-sections/{section}/blocks', [LandingBlockController::class, 'index']);
    Route::post('landing-sections/{section}/blocks', [LandingBlockController::class, 'store']);
    Route::put('landing-blocks/{block}', [LandingBlockController::class, 'update']);
    Route::delete('landing-blocks/{block}', [LandingBlockController::class, 'destroy']);
    Route::post('landing-blocks/reorder', [LandingBlockController::class, 'reorder']);

    // Influencers, Clients, Projects
    Route::apiResource('influencers', InfluencerController::class);
    Route::get('clients/{client}/profile', [ClientController::class, 'profile']);
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('agencies', AgencyController::class);
    Route::post('ai/strategy-suggestions', [AIController::class, 'strategySuggestions']);
    Route::post('ai/seo-recommendations', [AIController::class, 'seoRecommendations']);
    Route::post('ai/keyword-planner', [AIController::class, 'keywordPlanner']);
    Route::post('ai/content-ideas', [AIController::class, 'contentIdeas']);
    Route::post('ai/caption-generation', [AIController::class, 'captionGeneration']);
    Route::apiResource('projects', ProjectController::class);
    Route::get('project-assignments', [ProjectAssignmentController::class, 'index']);
    Route::post('project-assignments', [ProjectAssignmentController::class, 'store']);
    Route::post('project-assignments/bulk', [ProjectAssignmentController::class, 'storeBulk']);
    Route::delete('project-assignments/{projectAssignment}', [ProjectAssignmentController::class, 'destroy']);
    Route::get('work-dashboard', [WorkDashboardController::class, 'index']);
    Route::get('work-dashboard/reports/work-progress', [WorkDashboardController::class, 'workProgressReport']);
    Route::get('work-dashboard/reports/time-logged', [WorkDashboardController::class, 'timeLoggedReport']);
    Route::get('requirement-templates', [RequirementTemplateController::class, 'index']);
    Route::post('requirement-templates', [RequirementTemplateController::class, 'store']);
    Route::get('requirement-templates/{requirementTemplate}', [RequirementTemplateController::class, 'show']);
    Route::put('requirement-templates/{requirementTemplate}', [RequirementTemplateController::class, 'update']);
    Route::delete('requirement-templates/{requirementTemplate}', [RequirementTemplateController::class, 'destroy']);
    Route::get('requirement-gatherings', [RequirementGatheringController::class, 'index']);
    Route::post('requirement-gatherings', [RequirementGatheringController::class, 'store']);
    Route::get('requirement-gatherings/{requirementGathering}', [RequirementGatheringController::class, 'show']);
    Route::put('requirement-gatherings/{requirementGathering}', [RequirementGatheringController::class, 'update']);
    Route::delete('requirement-gatherings/{requirementGathering}', [RequirementGatheringController::class, 'destroy']);
    Route::post('requirement-gatherings/{requirementGathering}/documents', [RequirementGatheringController::class, 'storeDocument']);
    Route::delete('requirement-gatherings/{requirementGathering}/documents/{document}', [RequirementGatheringController::class, 'destroyDocument']);
    Route::get('strategy-reports', [StrategyReportController::class, 'index']);
    Route::post('strategy-reports', [StrategyReportController::class, 'store']);
    Route::get('strategy-reports/{strategyReport}', [StrategyReportController::class, 'show']);
    Route::put('strategy-reports/{strategyReport}', [StrategyReportController::class, 'update']);
    Route::delete('strategy-reports/{strategyReport}', [StrategyReportController::class, 'destroy']);
    Route::post('strategy-reports/{strategyReport}/send', [StrategyReportController::class, 'send']);
    Route::post('strategy-reports/{strategyReport}/approve', [StrategyReportController::class, 'approve']);
    Route::get('strategy-reports/{strategyReport}/pdf', [StrategyReportController::class, 'downloadPdf']);
    Route::get('agreements/{agreement}/pdf', [AgreementController::class, 'downloadPdf']);
    Route::apiResource('agreements', AgreementController::class);
    Route::apiResource('content-calendar', ContentCalendarController::class)->parameters(['content_calendar' => 'contentCalendarItem']);
    Route::apiResource('freelancers', FreelancerController::class);
    Route::get('projects/{project}/tasks', [ProjectTaskController::class, 'index']);
    Route::post('projects/{project}/tasks', [ProjectTaskController::class, 'store']);
    Route::put('project-tasks/{projectTask}', [ProjectTaskController::class, 'update']);
    Route::delete('project-tasks/{projectTask}', [ProjectTaskController::class, 'destroy']);

    // Deals pipeline (DMOS – extends CRM)
    Route::get('deal-stages', function (\Illuminate\Http\Request $request) {
        $tid = auth()->user()?->tenant_id ?? auth()->user()?->agency_id;
        $query = \App\Models\DealStage::query()->orderBy('order')->orderBy('id');
        if ($tid) {
            $query->where('tenant_id', $tid);
        }
        return response()->json(['data' => $query->get()]);
    });
    Route::get('deals', [DealController::class, 'index']);
    Route::post('deals', [DealController::class, 'store']);
    Route::get('deals/{id}', [DealController::class, 'show']);
    Route::put('deals/{id}', [DealController::class, 'update']);
    Route::delete('deals/{id}', [DealController::class, 'destroy']);

    // DMOS: branding (read-only for frontend theming)
    Route::get('branding', [BrandingController::class, 'show']);

    // DMOS: keywords, contact lists, vendors, brands, workflows, knowledge base, onboarding, automation, report templates, forms
    Route::get('keywords', [KeywordController::class, 'index']);
    Route::post('keywords', [KeywordController::class, 'store']);
    Route::get('keywords/{keyword}', [KeywordController::class, 'show']);
    Route::put('keywords/{keyword}', [KeywordController::class, 'update']);
    Route::delete('keywords/{keyword}', [KeywordController::class, 'destroy']);
    Route::get('contact-lists', [ContactListController::class, 'index']);
    Route::post('contact-lists', [ContactListController::class, 'store']);
    Route::get('contact-lists/{contactList}', [ContactListController::class, 'show']);
    Route::put('contact-lists/{contactList}', [ContactListController::class, 'update']);
    Route::delete('contact-lists/{contactList}', [ContactListController::class, 'destroy']);
    Route::get('vendors', [VendorController::class, 'index']);
    Route::post('vendors', [VendorController::class, 'store']);
    Route::get('vendors/{id}', [VendorController::class, 'show']);
    Route::put('vendors/{id}', [VendorController::class, 'update']);
    Route::delete('vendors/{id}', [VendorController::class, 'destroy']);
    Route::get('brands', [BrandController::class, 'index']);
    Route::post('brands', [BrandController::class, 'store']);
    Route::get('brands/{brand}', [BrandController::class, 'show']);
    Route::put('brands/{brand}', [BrandController::class, 'update']);
    Route::delete('brands/{brand}', [BrandController::class, 'destroy']);
    Route::get('workflow-templates', [WorkflowTemplateController::class, 'index']);
    Route::post('workflow-templates', [WorkflowTemplateController::class, 'store']);
    Route::get('workflow-templates/{workflowTemplate}', [WorkflowTemplateController::class, 'show']);
    Route::put('workflow-templates/{workflowTemplate}', [WorkflowTemplateController::class, 'update']);
    Route::delete('workflow-templates/{workflowTemplate}', [WorkflowTemplateController::class, 'destroy']);
    Route::get('knowledge-spaces', [KnowledgeSpaceController::class, 'index']);
    Route::post('knowledge-spaces', [KnowledgeSpaceController::class, 'store']);
    Route::get('knowledge-spaces/{knowledgeSpace}', [KnowledgeSpaceController::class, 'show']);
    Route::put('knowledge-spaces/{knowledgeSpace}', [KnowledgeSpaceController::class, 'update']);
    Route::delete('knowledge-spaces/{knowledgeSpace}', [KnowledgeSpaceController::class, 'destroy']);
    Route::get('onboarding-questionnaires', [OnboardingQuestionnaireController::class, 'index']);
    Route::post('onboarding-questionnaires', [OnboardingQuestionnaireController::class, 'store']);
    Route::get('onboarding-questionnaires/{onboardingQuestionnaire}', [OnboardingQuestionnaireController::class, 'show']);
    Route::put('onboarding-questionnaires/{onboardingQuestionnaire}', [OnboardingQuestionnaireController::class, 'update']);
    Route::delete('onboarding-questionnaires/{onboardingQuestionnaire}', [OnboardingQuestionnaireController::class, 'destroy']);
    Route::get('automation-workflows', [AutomationWorkflowController::class, 'index']);
    Route::post('automation-workflows', [AutomationWorkflowController::class, 'store']);
    Route::get('automation-workflows/{automationWorkflow}', [AutomationWorkflowController::class, 'show']);
    Route::put('automation-workflows/{automationWorkflow}', [AutomationWorkflowController::class, 'update']);
    Route::delete('automation-workflows/{automationWorkflow}', [AutomationWorkflowController::class, 'destroy']);
    Route::get('report-templates', [ReportTemplateController::class, 'index']);
    Route::post('report-templates', [ReportTemplateController::class, 'store']);
    Route::get('report-templates/{reportTemplate}', [ReportTemplateController::class, 'show']);
    Route::put('report-templates/{reportTemplate}', [ReportTemplateController::class, 'update']);
    Route::delete('report-templates/{reportTemplate}', [ReportTemplateController::class, 'destroy']);
    Route::get('service-packages', function (\Illuminate\Http\Request $request) {
        $tid = auth()->user()?->tenant_id ?? auth()->user()?->agency_id;
        $query = \App\Models\ServicePackage::query()->orderBy('name');
        if ($tid) {
            $query->where('tenant_id', $tid);
        }
        return response()->json(['data' => $query->get()]);
    });
    Route::get('forms', [FormController::class, 'index']);
    Route::post('forms', [FormController::class, 'store']);
    Route::get('forms/{form}', [FormController::class, 'show']);
    Route::put('forms/{form}', [FormController::class, 'update']);
    Route::delete('forms/{form}', [FormController::class, 'destroy']);

    // Influencer campaigns
    Route::apiResource('campaigns', CampaignController::class);

    // Reports
    Route::get('reports', [ReportController::class, 'index']);
    Route::post('reports', [ReportController::class, 'store']);
    Route::get('reports/{report}/pdf', [ReportController::class, 'downloadPdf']);
    Route::get('reports/{report}', [ReportController::class, 'show']);
    Route::delete('reports/{report}', [ReportController::class, 'destroy']);

    // Invoices & Quotations
    Route::get('quotations/build', [QuotationController::class, 'build']);
    Route::post('quotations/{quotation}/generate-pdf', [QuotationController::class, 'generatePdf']);
    Route::get('quotations/{quotation}/pdf', [QuotationController::class, 'downloadPdf']);
    Route::apiResource('quotations', QuotationController::class);
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::apiResource('invoice-adjustments', InvoiceAdjustmentController::class);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::post('invoices/{invoice}/create-payment', [PaymentGatewayController::class, 'createPayment']);
    Route::post('payments/confirm', [PaymentGatewayController::class, 'confirm']);

    // Tasks, Time, Leaves, Payroll
    Route::apiResource('tasks', TaskController::class);
    Route::get('time-logs', [TimeLogController::class, 'index']);
    Route::post('time-logs', [TimeLogController::class, 'store']);
    Route::delete('time-logs/{timeLog}', [TimeLogController::class, 'destroy']);
    Route::apiResource('leaves', LeaveController::class);
    Route::apiResource('payrolls', PayrollController::class);

    // Settings & SEO
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);

    // System settings (dynamic config: integrations, queue, ai, branding)
    Route::get('/system-settings', [SettingsApiController::class, 'index']);
    Route::get('/system-settings/queue-config', [SettingsApiController::class, 'queueConfig']);
    Route::get('/system-settings/ai-config', [SettingsApiController::class, 'aiConfig']);
    Route::get('/system-settings/branding-config', [SettingsApiController::class, 'brandingConfig']);
    Route::get('/system-settings/integration-config/{slug}', [SettingsApiController::class, 'integrationConfig']);
    Route::get('/system-settings/{key}', [SettingsApiController::class, 'show']);
    Route::put('/system-settings', [SettingsApiController::class, 'update']);

    Route::apiResource('plans', PlanController::class);
});
