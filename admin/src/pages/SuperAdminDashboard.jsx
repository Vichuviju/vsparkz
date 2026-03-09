import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const CHART_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];

function KPICard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
      <p className="text-sm font-medium dark:text-text-muted text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold dark:text-text-primary text-gray-900 tabular-nums">{value}</p>
      {sub != null && <p className="mt-1 text-xs dark:text-text-muted text-gray-500">{sub}</p>}
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

  useEffect(() => {
    if (!isSuperAdmin) return;
    api
      .get('/admin/super-admin/dashboard')
      .then(({ data: d }) => setData(d))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  const chartText = darkMode ? '#94A3B8' : '#6B7280';
  const chartGrid = darkMode ? '#334155' : '#E5E7EB';
  const tooltipBg = darkMode ? '#1E293B' : '#FFFFFF';
  const tooltipBorder = darkMode ? '#334155' : '#E5E7EB';

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
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent/30 border-t-accent" />
          <p className="text-sm dark:text-text-muted text-gray-500">Loading overview…</p>
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Super Admin Overview</h1>
        <p className="mt-1 text-sm dark:text-text-muted text-gray-500">
          Platform-wide stats: agencies, users, leads, clients, and revenue
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="Total users" value={data?.total_users ?? 0} />
        <KPICard label="Total leads" value={data?.total_leads ?? 0} />
        <KPICard label="Total clients" value={data?.total_clients ?? 0} />
        <KPICard label="Total projects" value={data?.total_projects ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by role - Pie */}
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
          <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-4">Users by role</h2>
          {rolePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={rolePieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: chartGrid }}
                >
                  {rolePieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={tooltipBg} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
                  formatter={(value) => [value, 'Users']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center dark:text-text-muted text-gray-500 text-sm">
              No user data
            </div>
          )}
        </div>

        {/* Revenue trend */}
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
          <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-4">Revenue (last 6 months)</h2>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="superRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: chartText, fontSize: 12 }} axisLine={{ stroke: chartGrid }} />
                <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={{ stroke: chartGrid }} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
                  formatter={(value) => [typeof value === 'number' ? `₹${Number(value).toLocaleString()}` : value, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#superRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center dark:text-text-muted text-gray-500 text-sm">
              No revenue data
            </div>
          )}
        </div>
      </div>

      {/* Agencies breakdown - Bar chart */}
      <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
        <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-4">Agencies overview</h2>
        {agencyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={agencyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: chartText, fontSize: 11 }}
                axisLine={{ stroke: chartGrid }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={{ stroke: chartGrid }} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
              />
              <Legend />
              <Bar dataKey="users" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Users" />
              <Bar dataKey="leads" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Leads" />
              <Bar dataKey="clients" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="Clients" />
              <Bar dataKey="projects" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center dark:text-text-muted text-gray-500 text-sm">
            No agencies yet
          </div>
        )}
      </div>

      {/* Agencies table */}
      {agencies.length > 0 && (
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white overflow-hidden shadow-lg dark:shadow-glass shadow-light">
          <h2 className="px-5 py-4 border-b dark:border-navy-600 border-gray-200 font-semibold dark:text-text-primary text-gray-900">
            Agencies listing
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Agency</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Users</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Leads</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Clients</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Projects</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{a.name}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{a.users_count}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{a.leads_count}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{a.clients_count}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{a.projects_count}</td>
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
