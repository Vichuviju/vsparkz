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

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
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
              <Route path="team" element={<Team />} />
              <Route path="pages" element={<Pages />} />
              <Route path="pages/:id" element={<PageEditor />} />
              <Route path="landing-builder" element={<LandingBuilder />} />
              <Route path="influencers" element={<Influencers />} />
              <Route path="influencers/:id" element={<InfluencerDetail />} />
              <Route path="influencer-categories" element={<InfluencerCategories />} />
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

              {/* Support & SMS */}
              <Route path="support-tickets" element={<SupportTickets />} />
              <Route path="support-tickets/:id" element={<TicketDetail />} />
              <Route path="sms-marketing" element={<SmsMarketing />} />

              {/* Batch 2 */}
              <Route path="ecommerce" element={<Ecommerce />} />
              <Route path="gamification" element={<Gamification />} />
              <Route path="url-shortener" element={<UrlShortener />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
