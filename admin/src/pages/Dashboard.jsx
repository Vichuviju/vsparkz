import { useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#64748b'];

// Sparkline component inside KPI cards
function Sparkline({ data, stroke, fill }) {
  const chartData = data.map((val, idx) => ({ idx, val }));
  return (
    <div className="w-full h-8 mt-2 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <defs>
            <linearGradient id={`sparkGrad-${stroke.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={0.3} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke={stroke} 
            strokeWidth={1.5} 
            fill={`url(#sparkGrad-${stroke.replace('#', '')})`} 
            dot={false} 
            isAnimationActive={false} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// KPI card
function KPICard({ label, value, trend, icon, sparkData, strokeColor, fillColor }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-bold flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              ↑ {trend}
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-2xl" style={{ backgroundColor: fillColor + '15', color: strokeColor }}>
          {icon}
        </div>
      </div>
      <Sparkline data={sparkData} stroke={strokeColor} fill={fillColor} />
    </div>
  );
}

export function Dashboard() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract first name for the greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'Vichu';

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const chartText = darkMode ? '#94A3B8' : '#6B7280';
  const chartGrid = darkMode ? '#334155' : '#F1F5F9';
  const tooltipBg = darkMode ? '#1E293B' : '#FFFFFF';
  const tooltipBorder = darkMode ? '#334155' : '#E2E8F0';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm dark:text-slate-400 text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-6 text-rose-700 dark:text-rose-300">
        {error}
      </div>
    );
  }

  // Fallback / Seed / Live API data mapping
  const totalLeads = data?.total_leads ?? 12540;
  const activeClients = data?.total_clients ?? 320;
  const totalRevenue = "₹8,42,000";
  const conversionRate = "8.62%";
  const websiteVisitors = "45,230";
  const campaignRoas = "4.35x";

  // Recharts chart data
  const visitorsChartData = [
    { date: 'May 8', visitors: 17000 },
    { date: 'May 15', visitors: 25000 },
    { date: 'May 22', visitors: 20000 },
    { date: 'May 29', visitors: 32000 },
    { date: 'Jun 5', visitors: 30000 },
    { date: 'Jun 12', visitors: 45230 },
  ];

  const revenueChartData = [
    { date: 'May 8', revenue: 500000 },
    { date: 'May 15', revenue: 450000 },
    { date: 'May 22', revenue: 380000 },
    { date: 'May 29', revenue: 600000 },
    { date: 'Jun 5', revenue: 580000 },
    { date: 'Jun 12', revenue: 842000 },
  ];

  const donutChartData = [
    { name: 'SEO', value: 40 },
    { name: 'Google Ads', value: 25 },
    { name: 'Instagram', value: 20 },
    { name: 'Facebook', value: 10 },
    { name: 'Others', value: 5 },
  ];

  const recentEnquiries = data?.recent_enquiries ?? [];

  return (
    <div className="space-y-8 animate-fade-in pb-12 select-none text-slate-800 dark:text-slate-100">
      
      {/* Top Banner & Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            Good Morning, {firstName}! 👋
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-400 dark:text-slate-500">
            Your marketing performance increased <span className="text-blue-600 dark:text-blue-400 font-bold">18%</span> this month.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all hover:bg-blue-100/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H13.62l1.378-7.7L6 13.305h5.187L9.813 15.904z" />
            </svg>
            Generate AI Strategy
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-[0.98]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Campaign
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard 
          label="Total Leads" 
          value={totalLeads.toLocaleString()} 
          trend="18.2%" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          sparkData={[10, 15, 12, 20, 18, 25, 22]} 
          strokeColor="#3b82f6" 
          fillColor="#3b82f6" 
        />
        <KPICard 
          label="Active Clients" 
          value={activeClients.toLocaleString()} 
          trend="14.6%" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          sparkData={[3, 5, 4, 8, 7, 10, 9]} 
          strokeColor="#06b6d4" 
          fillColor="#06b6d4" 
        />
        <KPICard 
          label="Revenue" 
          value={totalRevenue} 
          trend="22.8%" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          sparkData={[12, 19, 15, 25, 22, 30, 28]} 
          strokeColor="#8b5cf6" 
          fillColor="#8b5cf6" 
        />
        <KPICard 
          label="Conversion Rate" 
          value={conversionRate} 
          trend="12.5%" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1" />
            </svg>
          }
          sparkData={[4.5, 4.8, 5.2, 5.0, 5.8, 6.2, 8.62]} 
          strokeColor="#10b981" 
          fillColor="#10b981" 
        />
        <KPICard 
          label="Website Visitors" 
          value={websiteVisitors} 
          trend="16.7%" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          sparkData={[20, 24, 22, 28, 25, 32, 30]} 
          strokeColor="#f59e0b" 
          fillColor="#f59e0b" 
        />
        <KPICard 
          label="Campaign ROAS" 
          value={campaignRoas} 
          trend="30.6%" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2zm6 0v-8a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 00-2-2z" />
            </svg>
          }
          sparkData={[3.0, 3.2, 3.1, 3.5, 3.8, 4.0, 4.35]} 
          strokeColor="#ec4899" 
          fillColor="#ec4899" 
        />
      </div>

      {/* Row 1: Charts (Visitors Overview & Revenue Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors Overview */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Visitors Overview</h2>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 rounded-xl focus:outline-none">
                <option>Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorsChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartText, fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} />
                <YAxis tick={{ fill: chartText, fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: chartText }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} fill="url(#visitorsGrad)" dot={{ r: 4, strokeWidth: 2, stroke: '#3b82f6', fill: '#ffffff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Revenue Trend</h2>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 rounded-xl focus:outline-none">
                <option>Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartText, fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} />
                <YAxis tick={{ fill: chartText, fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} formatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: chartText }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, strokeWidth: 2, stroke: '#8b5cf6', fill: '#ffffff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Conversion Rate, Lead Funnel, and Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Conversion Rate Card (Circular Gauge) */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Conversion Rate</h2>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 rounded-xl focus:outline-none">
                <option>Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          
          <div className="py-6 text-center space-y-4">
            {/* Custom SVG Semi-circle Arc Gauge */}
            <div className="relative w-48 h-24 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <path 
                  d="M 10,50 A 40,40 0 0 1 90,50" 
                  fill="none" 
                  stroke="#f1f5f9" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  className="dark:stroke-slate-800"
                />
                <path 
                  d="M 10,50 A 40,40 0 0 1 90,50" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray="125" 
                  strokeDashoffset="22" 
                />
              </svg>
              <div className="absolute inset-x-0 bottom-0 text-center">
                <span className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">82%</span>
              </div>
            </div>
            <div className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block">
              +12.5% vs last month
            </div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal max-w-[200px] mx-auto">
              Your conversion rate is higher than <span className="text-blue-600 dark:text-blue-400 font-bold">82%</span> of other businesses.
            </p>
          </div>
        </div>

        {/* Lead Funnel Card */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Lead Funnel</h2>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 rounded-xl focus:outline-none">
                <option>Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          
          <div className="flex gap-5 items-center justify-between">
            {/* SVG Funnel Graphic */}
            <div className="w-16 h-40">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="blueFunnel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1d4ed8" /></linearGradient>
                  <linearGradient id="indigoFunnel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#4338ca" /></linearGradient>
                  <linearGradient id="purpleFunnel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#6b21a8" /></linearGradient>
                  <linearGradient id="pinkFunnel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#9d174d" /></linearGradient>
                  <linearGradient id="emeraldFunnel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#047857" /></linearGradient>
                </defs>
                <polygon points="5,5 95,5 82,20 18,20" fill="url(#blueFunnel)" />
                <polygon points="18,24 82,24 70,39 30,39" fill="url(#indigoFunnel)" />
                <polygon points="30,43 70,43 60,58 40,58" fill="url(#purpleFunnel)" />
                <polygon points="40,62 60,62 53,77 47,77" fill="url(#pinkFunnel)" />
                <polygon points="47,81 53,81 50,96 50,96" fill="url(#emeraldFunnel)" stroke="url(#emeraldFunnel)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            
            {/* Metrics List */}
            <div className="flex-1 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400 dark:text-slate-500">Visitors</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 dark:text-white">45,230</span>
                  <span className="text-slate-400 dark:text-slate-600 w-10 text-right">—</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400 dark:text-slate-500">Leads</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 dark:text-white">12,540</span>
                  <span className="font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded w-10 text-center">27.7%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400 dark:text-slate-500">Qualified</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 dark:text-white">8,420</span>
                  <span className="font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded w-10 text-center">18.6%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400 dark:text-slate-500">Proposals</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 dark:text-white">3,210</span>
                  <span className="font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded w-10 text-center">7.1%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400 dark:text-slate-500">Customers</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 dark:text-white">1,250</span>
                  <span className="font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded w-10 text-center">2.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Traffic Sources</h2>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 rounded-xl focus:outline-none">
                <option>Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={tooltipBg} strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2">
              {donutChartData.map((src, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="font-bold text-slate-500 dark:text-slate-400">{src.name}</span>
                  </div>
                  <span className="font-black text-slate-800 dark:text-white">{src.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Campaigns, Channel Performance, and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Campaigns */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Top Campaigns</h2>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 rounded-xl focus:outline-none">
                <option>Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">SEO Strategy</span>
                <span className="font-black text-slate-800 dark:text-white">12,540 <span className="text-[10px] font-bold text-emerald-500 ml-1">↑18.2%</span></span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Google Ads</span>
                <span className="font-black text-slate-800 dark:text-white">8,420 <span className="text-[10px] font-bold text-emerald-500 ml-1">↑14.5%</span></span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Instagram Ads</span>
                <span className="font-black text-slate-800 dark:text-white">6,120 <span className="text-[10px] font-bold text-emerald-500 ml-1">↑12.6%</span></span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Facebook Ads</span>
                <span className="font-black text-slate-800 dark:text-white">3,210 <span className="text-[10px] font-bold text-emerald-500 ml-1">↑8.4%</span></span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Channel Performance</h2>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 rounded-xl focus:outline-none">
                <option>Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 w-24">Organic Search</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }}></div>
              </div>
              <span className="font-black text-slate-800 dark:text-white w-8 text-right">40%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 w-24">Google Ads</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '25%' }}></div>
              </div>
              <span className="font-black text-slate-800 dark:text-white w-8 text-right">25%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 w-24">Instagram</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '20%' }}></div>
              </div>
              <span className="font-black text-slate-800 dark:text-white w-8 text-right">20%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 w-24">Facebook</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: '10%' }}></div>
              </div>
              <span className="font-black text-slate-800 dark:text-white w-8 text-right">10%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 w-24">Others</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '5%' }}></div>
              </div>
              <span className="font-black text-slate-800 dark:text-white w-8 text-right">5%</span>
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/20">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H13.62l1.378-7.7L6 13.305h5.187L9.813 15.904z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white text-base">AI Insights</h2>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md">Agent Activated</span>
            </div>
          </div>

          <div className="my-4 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span>Increase budget for Google Ads. ROI is <span className="font-bold text-slate-800 dark:text-white">35% higher</span> than other social networks.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span>Optimize landing pages to improve conversion rate by <span className="font-bold text-slate-800 dark:text-white">18%</span>.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span>Post more Reels on Instagram. Video engagement is currently <span className="font-bold text-slate-800 dark:text-white">high</span>.</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all hover:bg-blue-100/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H13.62l1.378-7.7L6 13.305h5.187L9.813 15.904z" /></svg>
            Generate Full Strategy
          </button>
        </div>
      </div>

      {/* Row 4: Recent Activities & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activities */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 dark:text-white text-base">Recent Activities</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg">New Lead</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">New lead registered from Contact Form</span>
              </div>
              <span className="text-slate-400 text-[10px] font-bold">10:20 AM</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">Campaign</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Google Ads campaign "Summer Sale" published</span>
              </div>
              <span className="text-slate-400 text-[10px] font-bold">10:32 AM</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded-lg">Proposal</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Client "TechNova" approved proposal</span>
              </div>
              <span className="text-slate-400 text-[10px] font-bold">11:40 AM</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-1 rounded-lg">Invoice</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Invoice #INV-2024-125 sent to Bright Digital</span>
              </div>
              <span className="text-slate-400 text-[10px] font-bold">12:10 PM</span>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Upcoming Tasks</h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked={false} />
                <span className="font-semibold text-slate-600 dark:text-slate-300">Follow up with TechNova</span>
              </div>
              <span className="font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg text-[10px]">Today</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked={false} />
                <span className="font-semibold text-slate-600 dark:text-slate-300">Create Facebook Ads campaign</span>
              </div>
              <span className="font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg text-[10px]">Tomorrow</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked={false} />
                <span className="font-semibold text-slate-600 dark:text-slate-300">Prepare monthly SEO report</span>
              </div>
              <span className="font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-lg text-[10px]">Jun 10</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked={false} />
                <span className="font-semibold text-slate-600 dark:text-slate-300">Client meeting with Bright Digital</span>
              </div>
              <span className="font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-lg text-[10px]">Jun 12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Recent Enquiries (Live Database Data Table) */}
      <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <h2 className="px-5 py-4 border-b border-slate-100 dark:border-white/10 font-bold text-slate-800 dark:text-white text-base">Recent Enquiries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Service</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-slate-400 dark:text-slate-500 text-center font-medium">No enquiries yet</td>
                </tr>
              ) : (
                recentEnquiries.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3.5 text-slate-800 dark:text-white font-bold">{lead.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{lead.email}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{lead.service?.title ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        lead.status === 'contacted' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 dark:text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
