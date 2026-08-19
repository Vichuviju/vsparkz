import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { LeadDetail } from './pages/LeadDetail';
import { Services } from './pages/Services';
import { Pages } from './pages/Pages';
import { PageEditor } from './pages/PageEditor';
import { Projects } from './pages/Projects';
import { Reports } from './pages/Reports';
import { Campaigns } from './pages/Campaigns';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { ProjectDetail } from './pages/ProjectDetail';
import { AssignProject } from './pages/AssignProject';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { Influencers } from './pages/Influencers';
import { InfluencerDetail } from './pages/InfluencerDetail';
import { InfluencerCategories } from './pages/InfluencerCategories';
import { AddInfluencer } from './pages/AddInfluencer';
import { AddFreelancer } from './pages/AddFreelancer';
import { Invoices } from './pages/Invoices';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';
import { TasksHR } from './pages/TasksHR';
import { LandingBuilder } from './pages/LandingBuilder';
import { SubServices } from './pages/SubServices';
import { PricingLevels } from './pages/PricingLevels';
import { ServicePrices } from './pages/ServicePrices';
import { ComboPackages } from './pages/ComboPackages';
import { PackageGenerator } from './pages/PackageGenerator';
import { RequirementGatherings } from './pages/RequirementGatherings';
import { RequirementTemplates } from './pages/RequirementTemplates';
import { StrategyReports } from './pages/StrategyReports';
import { FreelancersAdmin } from './pages/FreelancersAdmin';
import { Team } from './pages/Team';
import { Quotations } from './pages/Quotations';
import { QuotationDetail } from './pages/QuotationDetail';
import { Agreements } from './pages/Agreements';
import { AgreementDetail } from './pages/AgreementDetail';
import { SeoAnalyzer } from './pages/SeoAnalyzer';
import { Plans } from './pages/Plans';
import { Agencies } from './pages/Agencies';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { RolesAndPermissions } from './pages/RolesAndPermissions';
import { PlatformAdminDashboard } from './pages/platform/PlatformAdminDashboard';
import { PlatformTenants } from './pages/PlatformTenants';
import { PlatformPlans } from './pages/platform/PlatformPlans';
import { PlatformSubscriptions } from './pages/platform/PlatformSubscriptions';
import { Deals } from './pages/Deals';
import { SystemSettings } from './pages/SystemSettings';
import { SocialPlanner } from './pages/SocialPlanner';
import { AdsPerformance } from './pages/AdsPerformance';
import { SeoWorkspace } from './pages/SeoWorkspace';
import { EmailAutomation } from './pages/EmailAutomation';
import { Workflows } from './pages/Workflows';
import { Vendors } from './pages/Vendors';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { ServicePackages } from './pages/ServicePackages';
import { Brands } from './pages/Brands';
import { Compliance } from './pages/Compliance';
import { AutomationWorkflows } from './pages/AutomationWorkflows';
import { ReportTemplates } from './pages/ReportTemplates';
import { OnboardingQuestionnaires } from './pages/OnboardingQuestionnaires';
import { Forms } from './pages/Forms';
import { SupportTickets } from './pages/SupportTickets';
import { TicketDetail } from './pages/TicketDetail';
import { SmsMarketing } from './pages/SmsMarketing';
import { Ecommerce } from './pages/Ecommerce';
import { Gamification } from './pages/Gamification';
import { UrlShortener } from './pages/UrlShortener';
import { AssignedInfluencers } from './pages/AssignedInfluencers';
import { AssignedFreelancers } from './pages/AssignedFreelancers';
import { SelectPlan } from './pages/SelectPlan';
import { VipApprovals } from './pages/VipApprovals';

// Redux & Sync Imports
import { Provider } from 'react-redux';
import { store } from './store/store';
import { HRMSAuthSync } from './components/wappers/HRMSAuthSync';

// HRMS Imports
import { EmployeeMaster } from './modules/hrms/EmployeeMaster';
import { AddNewEmployee } from './modules/hrms/AddNewEmployee';
import { showDepartment } from './modules/hrms/department/showDepartment';
import { EmployeeGrid } from './modules/hrms/department/EmployeeGrid';
import { EmployeeDetails } from './modules/hrms/EmployeeInfo';
import { OfferLetterEditor } from './modules/hrms/OfferLetterEditor';
import { IncrementLetterEditor } from './modules/hrms/IncrementLetterEditor';
import { AttendanceDashboard } from './modules/hrms/attendance/AttendanceDashboard';
import { DailyAttendanceEntry } from './modules/hrms/attendance/DailyAttendanceEntry';
import { MonthlyAttendanceReport } from './modules/hrms/attendance/MonthlyAttendanceReport';
import { ShiftSettings } from './modules/hrms/attendance/ShiftSettings';
import { HolidayView } from './modules/hrms/attendance/Holiday';
import BiometricSync from './modules/hrms/attendance/BiometricSync';
import { LeaveDashboard } from './modules/hrms/leaves/LeaveDashboard';
import { ApplyLeavePage } from './modules/hrms/leaves/ApplyLeavePage';
import { LeaveRequestsPage } from './modules/hrms/leaves/LeaveRequestsPage';
import { LeaveManagementPage } from './modules/hrms/leaves/LeaveManagementPage';
import { LeavePolicyScreen } from './modules/hrms/leavePolicy/leavePolicyScreen';
import { PermissionListPage } from './modules/hrms/permissions/PermissionListPage';
import { UnifiedApprovalsPage } from './modules/hrms/approvals/UnifiedApprovalsPage';
import { SalaryAndLoanPage } from './modules/hrms/salaryAndLoan/SalaryAndLoanPage';
import { SalaryStructureSetup } from './modules/hrms/salaryAndLoan/SalaryStructurePage';
import { SalaryManagement } from './modules/hrms/salaryAndLoan/SalaryManagement';
import { FinalSettlementsPage } from './modules/hrms/payroll/FinalSettlementsPage';
import { LoanManagementPage } from './modules/hrms/salaryAndLoan/LoanManagementPage';
import { BonusAndPaymentsPage } from './modules/hrms/salaryAndLoan/BonusAndPaymentsPage';
import { SalaryPayoutsPage } from './modules/hrms/salaryAndLoan/SalaryPayoutsPage';
import { PFESIDashboard } from './modules/hrms/salaryAndLoan/PFESIDashboard';
import { PFManagementPage } from './modules/hrms/salaryAndLoan/PFManagementPage';
import { ESIManagementPage } from './modules/hrms/salaryAndLoan/ESIManagementPage';
import { ProfessionalTaxPage } from './modules/hrms/salaryAndLoan/ProfessionalTaxPage';
import { ExpenseManagementPage } from './modules/hrms/salaryAndLoan/ExpenseManagementPage';
import { HrmsStandardReports } from './modules/hrms/reports/HrmsStandardReports';
import { HrmsUserManagement } from './modules/hrms/admin/HrmsUserManagement';
import { HrmsRoleManagement } from './modules/hrms/admin/HrmsRoleManagement';
import { EssDashboard } from './modules/hrms/ess/EssDashboard';
import { EssPayslip } from './modules/hrms/ess/EssPayslip';
import { EssAttendance } from './modules/hrms/ess/EssAttendance';
import { EssProfile } from './modules/hrms/ess/EssProfile';
import { EssExpense } from './modules/hrms/ess/EssExpense';
import { HrmsAnalyticsDashboard } from './modules/hrms/reports/HrmsAnalyticsDashboard';
import { HRMSUnderConstruction } from './components/hrms/HRMSUnderConstruction';
import { HrmsAdminDashboard } from './modules/hrms/admin/HrmsAdminDashboard';
import { WorkflowSettingsPage } from './modules/hrms/workflow/WorkflowSettingsPage';
import AuditLogPage from './modules/hrms/admin/AuditLogPage';
import { SystemSettingsPage } from './modules/hrms/admin/SystemSettingsPage';

export default function App() {
  const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter basename={routerBasename}>
          <AuthProvider>
            <HRMSAuthSync>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/select-plan" element={<ProtectedRoute requireSubscription={false}><SelectPlan /></ProtectedRoute>} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="super-admin" element={<SuperAdminDashboard />} />
                  <Route path="super-admin/vip-approvals" element={<VipApprovals />} />
                  <Route path="roles-permissions" element={<RolesAndPermissions />} />
                  <Route path="platform-admin" element={<PlatformAdminDashboard />} />
                  <Route path="platform-admin/tenants" element={<PlatformTenants />} />
                  <Route path="platform-admin/plans" element={<PlatformPlans />} />
                  <Route path="platform-admin/subscriptions" element={<PlatformSubscriptions />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="leads/:id" element={<LeadDetail />} />
                  <Route path="services" element={<Services />} />
                  <Route path="sub-services" element={<SubServices />} />
                  <Route path="pricing-levels" element={<PricingLevels />} />
                  <Route path="service-prices" element={<ServicePrices />} />
                  <Route path="combo-packages" element={<ComboPackages />} />
                  <Route path="package-generator" element={<PackageGenerator />} />
                  <Route path="requirement-gatherings" element={<RequirementGatherings />} />
                  <Route path="requirement-templates" element={<RequirementTemplates />} />
                  <Route path="seo-analyzer" element={<SeoAnalyzer />} />
                  <Route path="strategy-reports" element={<StrategyReports />} />
                  <Route path="freelancers" element={<FreelancersAdmin />} />
                  <Route path="freelancers/add" element={<AddFreelancer />} />
                  <Route path="freelancers/edit/:id" element={<AddFreelancer />} />
                  <Route path="freelancers/assigned" element={<AssignedFreelancers />} />
                  <Route path="team" element={<Team />} />
                  <Route path="pages" element={<Pages />} />
                  <Route path="pages/:id" element={<PageEditor />} />
                  <Route path="landing-builder" element={<LandingBuilder />} />
                  <Route path="influencers" element={<Influencers />} />
                  <Route path="influencers/add" element={<AddInfluencer />} />
                  <Route path="influencers/edit/:id" element={<AddInfluencer />} />
                  <Route path="influencers/:id" element={<InfluencerDetail />} />
                  <Route path="influencer-categories" element={<InfluencerCategories />} />
                  <Route path="influencers/assigned" element={<AssignedInfluencers />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/:id" element={<ClientDetail />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectDetail />} />
                  <Route path="assign-project" element={<AssignProject />} />
                  <Route path="campaigns" element={<Campaigns />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="invoices/:id" element={<InvoiceDetail />} />
                  <Route path="quotations" element={<Quotations />} />
                  <Route path="quotations/:id" element={<QuotationDetail />} />
                  <Route path="agreements" element={<Agreements />} />
                  <Route path="agreements/:id" element={<AgreementDetail />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="system-settings" element={<SystemSettings />} />
                  <Route path="deals" element={<Deals />} />
                  <Route path="social-planner" element={<SocialPlanner />} />
                  <Route path="ads" element={<AdsPerformance />} />
                  <Route path="seo-workspace" element={<SeoWorkspace />} />
                  <Route path="email-automation" element={<EmailAutomation />} />
                  <Route path="sms-marketing" element={<SmsMarketing />} />
                  <Route path="url-shortener" element={<UrlShortener />} />
                  <Route path="workflows" element={<Workflows />} />
                  <Route path="vendors" element={<Vendors />} />
                  <Route path="knowledge-base" element={<KnowledgeBase />} />
                  <Route path="service-packages" element={<ServicePackages />} />
                  <Route path="brands" element={<Brands />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="automation" element={<AutomationWorkflows />} />
                  <Route path="report-templates" element={<ReportTemplates />} />
                  <Route path="onboarding-questionnaires" element={<OnboardingQuestionnaires />} />
                  <Route path="forms" element={<Forms />} />
                  <Route path="plans" element={<Plans />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="tasks-hr" element={<TasksHR />} />
                  <Route path="agencies" element={<Agencies />} />
                  <Route path="support-tickets" element={<SupportTickets />} />
                  <Route path="support-tickets/:id" element={<TicketDetail />} />
                  <Route path="ecommerce" element={<Ecommerce />} />
                  <Route path="gamification" element={<Gamification />} />

                  {/* HRMS Core Routes */}
                  <Route path="hrms/core/employees" element={<EmployeeMaster />} />
                  <Route path="hrms/core/add-employee" element={<AddNewEmployee />} />
                  <Route path="hrms/departments" element={<showDepartment />} />
                  <Route path="hrms/departments/:id/employees" element={<EmployeeGrid />} />
                  <Route path="hrms/employee/:id" element={<EmployeeDetails />} />
                  <Route path="hrms/employee/:id/offer-letter" element={<OfferLetterEditor />} />
                  <Route path="hrms/employee/:id/increment-letter/:historyId?" element={<IncrementLetterEditor />} />

                  {/* HRMS Attendance Routes */}
                  <Route path="hrms/attendance/dashboard" element={<AttendanceDashboard />} />
                  <Route path="hrms/attendance/daily" element={<DailyAttendanceEntry />} />
                  <Route path="hrms/attendance/reports" element={<MonthlyAttendanceReport />} />
                  <Route path="hrms/attendance/holiday" element={<HolidayView />} />
                  <Route path="hrms/attendance/weekly-off" element={<HolidayView />} />
                  <Route path="hrms/attendance/shifts" element={<ShiftSettings />} />
                  <Route path="hrms/attendance/sync" element={<BiometricSync />} />

                  {/* HRMS Leave Routes */}
                  <Route path="hrms/leave/dashboard" element={<LeaveDashboard />} />
                  <Route path="hrms/leave/apply" element={<ApplyLeavePage />} />
                  <Route path="hrms/leave/requests" element={<LeaveRequestsPage />} />
                  <Route path="hrms/leave/policy" element={<LeavePolicyScreen />} />
                  <Route path="hrms/leave/permission" element={<PermissionListPage />} />
                  <Route path="hrms/admin/leave-balances" element={<LeaveManagementPage />} />

                  {/* HRMS Unified Approvals */}
                  <Route path="hrms/approvals/unified" element={<UnifiedApprovalsPage />} />

                  {/* HRMS Payroll Routes */}
                  <Route path="hrms/payroll/dashboard" element={<SalaryAndLoanPage />} />
                  <Route path="hrms/payroll/structure" element={<SalaryStructureSetup />} />
                  <Route path="hrms/payroll/process" element={<SalaryManagement />} />
                  <Route path="hrms/payroll/settlements" element={<FinalSettlementsPage />} />
                  <Route path="hrms/payroll/loans" element={<LoanManagementPage />} />
                  <Route path="hrms/payroll/bonus" element={<BonusAndPaymentsPage />} />
                  <Route path="hrms/payroll/history" element={<SalaryPayoutsPage />} />

                  {/* HRMS Compliance Routes */}
                  <Route path="hrms/compliance/dashboard" element={<PFESIDashboard />} />
                  <Route path="hrms/compliance/pf" element={<PFManagementPage />} />
                  <Route path="hrms/compliance/esi" element={<ESIManagementPage />} />
                  <Route path="hrms/compliance/pt" element={<ProfessionalTaxPage />} />

                  {/* HRMS Expense Routes */}
                  <Route path="hrms/expense/management" element={<ExpenseManagementPage />} />
                  <Route path="hrms/expense/dashboard" element={<ExpenseManagementPage mode="dashboard" />} />
                  <Route path="hrms/expense/add" element={<ExpenseManagementPage mode="add" />} />
                  <Route path="hrms/expense/approvals" element={<LeaveRequestsPage />} />
                  <Route path="hrms/expense/reimbursement" element={<ExpenseManagementPage mode="reimbursement" />} />

                  {/* HRMS ESS Routes */}
                  <Route path="hrms/ess/dashboard" element={<EssDashboard />} />
                  <Route path="hrms/ess/payslips" element={<EssPayslip />} />
                  <Route path="hrms/ess/attendance" element={<EssAttendance />} />
                  <Route path="hrms/ess/profile" element={<EssProfile />} />
                  <Route path="hrms/ess/expenses" element={<EssExpense />} />

                  {/* HRMS Reports Routes */}
                  <Route path="hrms/reports/standard" element={<HrmsStandardReports />} />
                  <Route path="hrms/reports/analytics" element={<HrmsAnalyticsDashboard />} />

                  {/* HRMS Admin Routes */}
                  <Route path="hrms/admin/dashboard" element={<HrmsAdminDashboard />} />
                  <Route path="hrms/admin/workflow" element={<WorkflowSettingsPage />} />
                  <Route path="hrms/admin/users" element={<HrmsUserManagement />} />
                  <Route path="hrms/admin/roles" element={<HrmsRoleManagement />} />
                  <Route path="hrms/admin/audit" element={<AuditLogPage />} />
                  <Route path="hrms/admin/settings" element={<SystemSettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HRMSAuthSync>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
