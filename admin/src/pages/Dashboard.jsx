import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';

const CHART_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

// KPI card with icon
function KPICard({ label, value, icon, trend }) {
  const icons = {
    leads: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    leadsMonth: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    clients: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    projects: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light transition-all duration-300 hover:shadow-xl dark:hover:shadow-glow hover:-translate-y-0.5">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 bg-accent" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium dark:text-text-muted text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold dark:text-text-primary text-gray-900 tabular-nums">{value}</p>
          {trend != null && (
            <p className={`mt-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-accent/15 text-accent dark:bg-accent/20 dark:text-accent">
          {icons[icon] || icons.leads}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { darkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const chartText = darkMode ? '#94A3B8' : '#6B7280';
  const chartGrid = darkMode ? '#334155' : '#E5E7EB';
  const tooltipBg = darkMode ? '#1E293B' : '#FFFFFF';
  const tooltipBorder = darkMode ? '#334155' : '#E5E7EB';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent/30 border-t-accent" />
          <p className="text-sm dark:text-text-muted text-gray-500">Loading dashboard…</p>
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

  const leadsBySourceData = data?.leads_by_source?.map(s => ({ name: s.source, value: s.count })) ?? [];
  const revenueData = data?.revenue_by_month?.map(r => ({ month: r.month, revenue: r.revenue })) ?? [];
  const leadFunnelData = data?.funnel ? Object.entries(data.funnel).map(([status, count]) => ({ name: status.replace('_', ' '), value: count })) : [];
  const recentEnquiries = data?.recent_enquiries ?? [];
  const topService = data?.top_requested_service;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm dark:text-text-muted text-gray-500">Overview of leads, clients, and revenue</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="Total Leads" value={data?.total_leads ?? 0} icon="leads" />
        <KPICard label="Leads This Month" value={data?.leads_this_month ?? 0} icon="leadsMonth" />
        <KPICard label="Total Clients" value={data?.total_clients ?? 0} icon="clients" />
        <KPICard label="Active Projects" value={data?.active_projects ?? 0} icon="projects" />
      </div>

      {/* Top requested service */}
      {topService?.title && (
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
          <h2 className="text-sm font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wide mb-1">Top requested service</h2>
          <p className="text-lg font-semibold dark:text-text-primary text-gray-900">{topService.title}</p>
          <p className="text-sm dark:text-text-muted text-gray-500">{topService.count} leads</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel Bar Chart */}
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
          <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-4">Lead Funnel</h2>
          {leadFunnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={leadFunnelData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: chartText, fontSize: 12 }} axisLine={{ stroke: chartGrid }} />
                <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={{ stroke: chartGrid }} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
                  labelStyle={{ color: chartText }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center dark:text-text-muted text-gray-500 text-sm">No funnel data</div>
          )}
        </div>

        {/* Leads by Source Pie Chart */}
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
          <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-4">Leads by Source</h2>
          {leadsBySourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={leadsBySourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  innerRadius={44}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: chartGrid }}
                >
                  {leadsBySourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={tooltipBg} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
                  formatter={(value) => [value, 'Leads']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center dark:text-text-muted text-gray-500 text-sm">No source data</div>
          )}
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
        <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-4">Revenue trend (last 6 months)</h2>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: chartText, fontSize: 12 }} axisLine={{ stroke: chartGrid }} />
              <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={{ stroke: chartGrid }} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
                formatter={(value) => [typeof value === 'number' ? `₹${value.toLocaleString()}` : value, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center dark:text-text-muted text-gray-500 text-sm">No revenue data yet</div>
        )}
      </div>

      {/* Recent Enquiries */}
      <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white overflow-hidden shadow-lg dark:shadow-glass shadow-light">
        <h2 className="px-5 py-4 border-b dark:border-navy-600 border-gray-200 font-semibold dark:text-text-primary text-gray-900">Recent enquiries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Name</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Email</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Service</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Status</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 dark:text-text-muted text-gray-500 text-center">No enquiries yet</td>
                </tr>
              ) : (
                recentEnquiries.map((lead) => (
                  <tr key={lead.id} className="border-t dark:border-navy-600 border-gray-100 hover:dark:bg-navy-700/30 hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{lead.name}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{lead.email}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{lead.service?.title ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                        lead.status === 'new' ? 'dark:bg-accent/20 dark:text-accent bg-blue-100 text-blue-700' :
                        lead.status === 'contacted' ? 'dark:bg-accent-muted/30 dark:text-accent-bright bg-cyan-100 text-cyan-800' :
                        'dark:bg-navy-600 dark:text-text-muted bg-gray-100 text-gray-600'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</td>
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
