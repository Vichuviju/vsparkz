import { useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

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
function KPICard({ label, value, icon, sparkData, strokeColor, fillColor }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-bold flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              ↑ 12.4%
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

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Vichu';

  useEffect(() => {
    if (!isSuperAdmin) return;
    api
      .get('/admin/super-admin/dashboard')
      .then(({ data: d }) => setData(d))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  const chartText = darkMode ? '#94A3B8' : '#6B7280';
  const chartGrid = darkMode ? '#334155' : '#F1F5F9';
  const tooltipBg = darkMode ? '#1E293B' : '#FFFFFF';
  const tooltipBorder = darkMode ? '#334155' : '#E2E8F0';

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-800 dark:text-amber-200">
        Access restricted. Super admin only.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center min-h-[60vh] items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm dark:text-slate-400 text-gray-500">Loading overview…</p>
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

  const agencies = data?.agencies ?? [];
  const usersByRole = data?.users_by_role ?? [];
  const revenueByMonth = data?.revenue_by_month ?? [];

  const agencyChartData = agencies.map((a) => ({
    name: a.name.length > 12 ? a.name.slice(0, 12) + '…' : a.name,
    users: a.users_count,
    leads: a.leads_count,
    clients: a.clients_count,
    projects: a.projects_count,
  }));

  const rolePieData = usersByRole.map((r) => ({ name: r.role?.replace('_', ' ') ?? r.role, value: r.count }));
  const revenueChartData = revenueByMonth.map((r) => ({ month: r.month, revenue: Number(r.revenue) }));

  // Fallbacks for empty platform state
  const finalRevenueData = revenueChartData.length > 0 ? revenueChartData : [
    { month: 'Jan', revenue: 200000 },
    { month: 'Feb', revenue: 350000 },
    { month: 'Mar', revenue: 300000 },
    { month: 'Apr', revenue: 500000 },
    { month: 'May', revenue: 650000 },
    { month: 'Jun', revenue: 842000 },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12 select-none text-slate-800 dark:text-slate-100">
      
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            Good Morning, {firstName}! 👋
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-400 dark:text-slate-500">
            Platform Overview: Managing marketing networks, system workloads, and client pipelines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all hover:bg-blue-100/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H13.62l1.378-7.7L6 13.305h5.187L9.813 15.904z" />
            </svg>
            System Diagnostics
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-[0.98]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Provision Agency
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          label="Total Users" 
          value={(data?.total_users ?? 0).toLocaleString()} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          sparkData={[50, 62, 70, 65, 82, 89, 95]} 
          strokeColor="#3b82f6" 
          fillColor="#3b82f6" 
        />
        <KPICard 
          label="Total Leads" 
          value={(data?.total_leads ?? 0).toLocaleString()} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H13.62l1.378-7.7L6 13.305h5.187L9.813 15.904z" />
            </svg>
          }
          sparkData={[120, 140, 135, 170, 160, 195, 210]} 
          strokeColor="#06b6d4" 
          fillColor="#06b6d4" 
        />
        <KPICard 
          label="Total Clients" 
          value={(data?.total_clients ?? 0).toLocaleString()} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          sparkData={[24, 28, 26, 32, 35, 41, 45]} 
          strokeColor="#8b5cf6" 
          fillColor="#8b5cf6" 
        />
        <KPICard 
          label="Total Projects" 
          value={(data?.total_projects ?? 0).toLocaleString()} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          sparkData={[8, 12, 11, 16, 15, 22, 20]} 
          strokeColor="#10b981" 
          fillColor="#10b981" 
        />
      </div>

      {/* Row 1: Users by Role (Pie/Donut) & Revenue Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Role */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Users by Role</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Interactive</span>
          </div>
          
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="w-36 h-36">
              {rolePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rolePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {rolePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={tooltipBg} strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No Data</div>
              )}
            </div>
            
            <div className="flex-1 space-y-1.5">
              {rolePieData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="font-bold text-slate-500 dark:text-slate-400 capitalize">{item.name}</span>
                  </div>
                  <span className="font-black text-slate-800 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Revenue (Last 6 Months)</h2>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">↑ 22.8%</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finalRevenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: chartText, fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} />
                <YAxis tick={{ fill: chartText, fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} formatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: chartText }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, strokeWidth: 2, stroke: '#8b5cf6', fill: '#ffffff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Agencies breakdown - Bar chart */}
      <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-800 dark:text-white text-base">Agencies Overview</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Cross-agency statistics</span>
        </div>
        {agencyChartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agencyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: chartText, fontSize: 10, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} />
                <YAxis tick={{ fill: chartText, fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: chartGrid }} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="users" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} name="Users" />
                <Bar dataKey="leads" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} name="Leads" />
                <Bar dataKey="clients" fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} name="Clients" />
                <Bar dataKey="projects" fill={CHART_COLORS[3]} radius={[3, 3, 0, 0]} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No agencies provisioned yet</div>
        )}
      </div>

      {/* Row 3: Agencies table */}
      {agencies.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
          <h2 className="px-5 py-4 border-b border-slate-100 dark:border-white/10 font-bold text-slate-800 dark:text-white text-base">Agencies Listing</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Agency</th>
                  <th className="px-5 py-3.5">Users</th>
                  <th className="px-5 py-3.5">Leads</th>
                  <th className="px-5 py-3.5">Clients</th>
                  <th className="px-5 py-3.5">Projects</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3.5 text-slate-800 dark:text-white font-bold">{a.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{a.users_count}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{a.leads_count}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{a.clients_count}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{a.projects_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
