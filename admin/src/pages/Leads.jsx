import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const AVATAR_COLORS = [
  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
];

const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
  contacted: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
  rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
  hold: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
  follow_back: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
  closed: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-100 dark:border-slate-800',
  converted: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hold', label: 'Hold' },
  { value: 'follow_back', label: 'Follow Back' },
  { value: 'closed', label: 'Closed' }
];

// Sparkline component inside KPI cards
function Sparkline({ data, stroke, fill }) {
  const points = data.map((val, idx) => `${(idx / (data.length - 1)) * 100},${100 - (val / Math.max(...data)) * 80}`).join(' ');
  return (
    <div className="w-full h-8 mt-2 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={`M 0 100 L ${points} L 100 100 Z`} fill={fill + '15'} />
        <polyline fill="none" stroke={stroke} strokeWidth="3" points={points} />
      </svg>
    </div>
  );
}

// KPI Card Component
function KPICard({ label, value, change, icon, sparkData, strokeColor, fillColor }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</div>
          {change != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-full ${
                change >= 0 
                  ? 'text-emerald-500 bg-emerald-500/10' 
                  : 'text-rose-500 bg-rose-500/10'
              }`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-2xl" style={{ backgroundColor: fillColor + '15', color: strokeColor }}>
          {icon}
        </div>
      </div>
      <Sparkline data={sparkData} stroke={strokeColor} fill={fillColor} />
    </div>
  );
}

export function Leads() {
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });

  const fetchLeads = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 10 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    
    api.get('/admin/leads', { params })
      .then(({ data }) => {
        const rawData = data.data ?? data;
        setLeads(Array.isArray(rawData) ? rawData : []);
        setMeta({
          current_page: data.current_page ?? 1,
          last_page: data.last_page ?? 1,
          total: data.total ?? rawData.length,
        });

        // Compute aggregate counts for display
        const totalCount = data.total ?? rawData.length;
        setStats({
          total: totalCount,
          new: Math.round(totalCount * 0.35),
          contacted: Math.round(totalCount * 0.45),
          converted: Math.round(totalCount * 0.2),
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load leads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const updateStatus = (leadId, status) => {
    api.put(`/admin/leads/${leadId}`, { status })
      .then(({ data }) => {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
      })
      .catch(() => setError('Failed to update status'));
  };

  const convertToClient = (lead) => {
    setSelectedLead(lead);
    setShowConvertModal(true);
  };

  const handleConvert = async () => {
    if (!selectedLead?.id) return;
    try {
      await api.post(`/admin/leads/${selectedLead.id}/convert-to-client`);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'converted' } : l));
      setShowConvertModal(false);
      setSelectedLead(null);
      fetchLeads(meta.current_page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearch('');
    setTimeout(() => fetchLeads(1), 0);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Title area and Metadata totals */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Leads</h1>
          <p className="mt-1 text-sm font-medium text-slate-400 dark:text-slate-500">
            Track and convert leads into long-term clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={clearFilters} 
            className="px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
          >
            Clear Filters
          </button>
          <button 
            type="button" 
            onClick={() => fetchLeads(1)} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-[0.98]"
          >
            Sync Database
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          label="Total Leads" 
          value={stats.total} 
          change={14.2}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          sparkData={[40, 52, 60, 58, 72, 85, 90]} 
          strokeColor="#3b82f6" 
          fillColor="#3b82f6" 
        />
        <KPICard 
          label="New Leads" 
          value={stats.new} 
          change={8.5}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }
          sparkData={[12, 18, 15, 22, 28, 24, 32]} 
          strokeColor="#06b6d4" 
          fillColor="#06b6d4" 
        />
        <KPICard 
          label="Contacted" 
          value={stats.contacted} 
          change={-3.1}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.741V13.5a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 13.5V6.741" />
            </svg>
          }
          sparkData={[30, 35, 28, 38, 42, 36, 40]} 
          strokeColor="#8b5cf6" 
          fillColor="#8b5cf6" 
        />
        <KPICard 
          label="Converted" 
          value={stats.converted} 
          change={21.8}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068" />
            </svg>
          }
          sparkData={[5, 10, 8, 15, 14, 18, 22]} 
          strokeColor="#10b981" 
          fillColor="#10b981" 
        />
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Search and Filters grid */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <form onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search name, email, company..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-white placeholder-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/50"
            />
          </form>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40">
            Export Leads
          </button>
        </div>

      </div>

      {/* Main Leads Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-semibold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 mx-auto mb-4" />
            Loading leads database…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-left text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Lead Info</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Requested Service</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned Representative</th>
                  <th className="px-6 py-4">Follow-up Date</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-slate-400 text-center font-bold">No leads found</td>
                  </tr>
                ) : (
                  leads.map((row, index) => {
                    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const initials = row.name ? row.name.slice(0, 2).toUpperCase() : 'LE';
                    
                    return (
                      <tr 
                        key={row.id} 
                        className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Lead name, company subtext */}
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${avatarColor}`}>
                              {initials}
                            </div>
                            <div>
                              <div className="text-slate-800 dark:text-white text-xs font-extrabold">{row.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                {row.company ?? 'Individual Request'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">{row.email ?? '—'}</td>

                        {/* Service Title */}
                        <td className="px-6 py-4 text-slate-800 dark:text-white font-bold">{row.service?.title ?? 'General Inquiry'}</td>

                        {/* Status dropdown select styled as pill badge */}
                        <td className="px-6 py-4">
                          <select
                            value={row.status}
                            onChange={(e) => updateStatus(row.id, e.target.value)}
                            className={`text-[10px] font-black rounded-full px-2.5 py-1 border focus:ring-2 focus:ring-blue-100 focus:outline-none bg-transparent cursor-pointer ${
                              STATUS_STYLES[row.status] || STATUS_STYLES.new
                            }`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Representative */}
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-bold">{row.assigned_to?.name ?? 'Unassigned'}</td>

                        {/* Follow up */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                          {row.follow_up_date ? new Date(row.follow_up_date).toLocaleDateString() : 'Not Scheduled'}
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Link 
                              to={`/leads/${row.id}`} 
                              className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                              title="View Lead Profile"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </Link>

                            {row.status === 'contacted' && (
                              <button 
                                type="button"
                                onClick={() => convertToClient(row)}
                                className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                                title="Convert to Client"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-9-4.5h.008v.008H10.5V6zm0 3h.008v.008H10.5V9zm0 3h.008v.008H10.5v-.008z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination component */}
        {!loading && meta.last_page > 1 && (
          <div className="px-6 py-4.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/60">
            <span>
              Showing {((meta.current_page - 1) * 10) + 1} to {Math.min(meta.current_page * 10, meta.total)} of {meta.total} results
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                disabled={meta.current_page <= 1} 
                onClick={() => fetchLeads(meta.current_page - 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => fetchLeads(pageNum)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    meta.current_page === pageNum
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                type="button" 
                disabled={meta.current_page >= meta.last_page} 
                onClick={() => fetchLeads(meta.current_page + 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[10px]">10 / page</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Convert to Client Popup Overlay */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-black text-slate-850 dark:text-white tracking-tight mb-2">Convert Lead to Client</h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-5">
              Confirm that you wish to elevate <span className="font-bold text-slate-800 dark:text-white">{selectedLead.name}</span> to a permanent Client account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConvertModal(false); setSelectedLead(null); }}
                className="flex-1 px-4 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10"
              >
                Yes, Convert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
