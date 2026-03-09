import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PortalRoute from './components/PortalRoute';
import ClientDashboardLayout from './components/ClientDashboardLayout';
import LandingPage from './pages/LandingPage';
import PageBySlug from './pages/PageBySlug';
import Contact from './pages/Contact';
import GetQuote from './pages/GetQuote';
import InfluencerOnboarding from './pages/InfluencerOnboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardHome from './pages/client/DashboardHome';
import DashboardInvoices from './pages/client/DashboardInvoices';
import DashboardProjects from './pages/client/DashboardProjects';
import DashboardQuotations from './pages/client/DashboardQuotations';
import AssignedProjects from './pages/portal/AssignedProjects';
import DashboardReports from './pages/client/DashboardReports';
import DashboardSupport from './pages/client/DashboardSupport';
import DashboardAgreements from './pages/client/DashboardAgreements';
import Freelancers from './pages/Freelancers';
import FreelancerDetail from './pages/FreelancerDetail';
import SeoAnalyzer from './pages/tools/SeoAnalyzer';
import MetaPageAnalyzer from './pages/tools/MetaPageAnalyzer';
import StrategyPlanner from './pages/tools/StrategyPlanner';
import Offers from './pages/Offers';
import OfferDetail from './pages/OfferDetail';
import PricingPage from './pages/PricingPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/portal/assigned-projects" element={<PortalRoute><AssignedProjects /></PortalRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><ClientDashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="projects" element={<DashboardProjects />} />
          <Route path="quotations" element={<DashboardQuotations />} />
          <Route path="invoices" element={<DashboardInvoices />} />
          <Route path="agreements" element={<DashboardAgreements />} />
          <Route path="reports" element={<DashboardReports />} />
          <Route path="support" element={<DashboardSupport />} />
        </Route>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="freelancers" element={<Freelancers />} />
          <Route path="freelancers/:id" element={<FreelancerDetail />} />
          <Route path="tools/seo-analyzer" element={<SeoAnalyzer />} />
          <Route path="tools/meta-page-analyzer" element={<MetaPageAnalyzer />} />
          <Route path="tools/strategy-planner" element={<StrategyPlanner />} />
          <Route path="about" element={<PageBySlug />} />
          <Route path="services" element={<PageBySlug />} />
          <Route path="influencer-marketing" element={<PageBySlug />} />
          <Route path="case-studies" element={<PageBySlug />} />
          <Route path="clients" element={<PageBySlug />} />
          <Route path="contact" element={<Contact />} />
          <Route path="offers" element={<Offers />} />
          <Route path="offers/:id" element={<OfferDetail />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="get-quote" element={<GetQuote />} />
          <Route path="influencer-onboarding" element={<InfluencerOnboarding />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
