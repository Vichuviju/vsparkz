import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

// Status badge component
function StatusBadge({ status }) {
  const colors = {
    new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    follow_back: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || colors.new}`}>
      {status?.replace('_', ' ') || 'new'}
    </span>
  );
}

// KPI Card component
function KPICard({ label, value, change, icon, color }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 bg-accent" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium dark:text-text-muted text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold dark:text-text-primary text-gray-900 tabular-nums">{value}</p>
          {change != null && (
            <p className={`mt-1 text-xs font-medium ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hold', label: 'Hold' },
  { value: 'follow_back', label: 'Follow Back' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_STYLES = {
  new: 'bg-sky-500/20 text-sky-400 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/30',
  contacted: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
  hold: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  follow_back: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
  closed: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
};

export function Leads() {
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service_id: '',
    subject: '',
    message: '',
    status: 'new'
  });

  const fetchLeads = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    api
      .get('/admin/leads', { params })
      .then(({ data }) => {
        setLeads(data.data ?? data);
        setMeta({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        });
        // Calculate stats
        const allLeads = data.data ?? data;
        setStats({
          total: allLeads.length,
          new: allLeads.filter(l => l.status === 'new').length,
          contacted: allLeads.filter(l => l.status === 'contacted').length,
          converted: allLeads.filter(l => l.status === 'closed').length,
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load leads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  useEffect(() => {
    api.get('/admin/services').then(({ data }) => setServices(data.data || data));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const updateStatus = (leadId, status) => {
    api
      .put(`/admin/leads/${leadId}`, { status })
      .then(({ data }) => {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data : l)));
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/leads', newLead);
      setLeads(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        company: '',
        service_id: '',
        subject: '',
        message: '',
        status: 'new'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lead');
    }
  };

  const hasFilters = statusFilter || search.trim();
  const clearFilters = () => {
    setStatusFilter('');
    setSearch('');
    setTimeout(() => fetchLeads(1), 0);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with KPI Cards */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900 tracking-tight">Leads Management</h1>
            <p className="mt-1 text-sm dark:text-text-muted text-gray-500">Track and convert leads to clients</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Lead
            </button>
            {meta.total != null && !loading && (
              <div className="flex items-center gap-2 text-sm dark:text-text-muted text-gray-500">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg dark:bg-navy-800/80 bg-gray-100">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium dark:text-text-primary text-gray-900">{meta.total}</span> total
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard 
            label="Total Leads" 
            value={stats.total} 
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="bg-blue-500"
          />
          <KPICard 
            label="New Leads" 
            value={stats.new} 
            change={12}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m3 0a9 9 0 11-18 0 9 9 0 0118 0zm-9 9a9 9 0 01-9-9m9 9H0" />
              </svg>
            }
            color="bg-emerald-500"
          />
          <KPICard 
            label="Contacted" 
            value={stats.contacted} 
            change={-5}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            color="bg-amber-500"
          />
          <KPICard 
            label="Converted" 
            value={stats.converted} 
            change={8}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-purple-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="p-1 rounded hover:bg-rose-500/20" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-5 shadow-lg dark:shadow-glass shadow-light">
        <div className="flex flex-wrap gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-text-muted text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search name, email, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-xl dark:text-text-primary text-gray-900 placeholder-gray-400 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-2.5 text-sm font-medium rounded-xl">
              Search
            </button>
          </form>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-xl dark:text-text-primary text-gray-900 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="rejected">Rejected</option>
              <option value="hold">Hold</option>
              <option value="follow_back">Follow Back</option>
              <option value="closed">Closed</option>
            </select>
            <button className="px-4 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-xl dark:text-text-primary text-gray-900 text-sm hover:bg-accent hover:text-white transition-all">
              Export
            </button>
            {hasFilters && (
              <button 
                onClick={clearFilters}
                className="px-4 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-xl dark:text-text-primary text-gray-900 text-sm hover:bg-gray-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/40 bg-white/95 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent/30 border-t-accent" />
            <p className="text-sm dark:text-text-muted text-gray-500">Loading leads…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-navy-800/70 bg-gray-50/90 border-b dark:border-navy-600 border-gray-200">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Follow-up</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-navy-600/80 divide-gray-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl dark:bg-navy-800/80 bg-gray-100 flex items-center justify-center text-gray-400 dark:text-text-muted">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <p className="text-sm font-medium dark:text-text-primary text-gray-900">No leads found</p>
                        <p className="text-xs dark:text-text-muted text-gray-500 max-w-xs">Try adjusting your search or filters, or add a new lead.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="dark:hover:bg-navy-700/30 hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-medium dark:text-text-primary text-gray-900">{lead.name || '—'}</span>
                        {lead.company && (
                          <span className="block text-xs dark:text-text-muted text-gray-500 mt-0.5">{lead.company}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 dark:text-text-muted text-gray-600">{lead.email || '—'}</td>
                      <td className="px-5 py-3.5 dark:text-text-muted text-gray-600">{lead.service?.title ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className={`text-xs font-medium rounded-lg px-2.5 py-1 border cursor-pointer focus:ring-2 focus:ring-accent/40 focus:outline-none dark:bg-transparent bg-transparent ${STATUS_STYLES[lead.status] || STATUS_STYLES.new}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 dark:text-text-muted text-gray-600">{lead.assigned_to?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 dark:text-text-muted text-gray-600">
                        {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 dark:text-text-muted text-gray-600">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/leads/${lead.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:text-accent-bright dark:hover:text-cyan-300 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Link>
                          {lead.status === 'contacted' && (
                            <button
                              onClick={() => convertToClient(lead)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m3 0a9 9 0 11-18 0 9 9 0 0118 0zm-9 9a9 9 0 01-9-9m9 9H0" />
                              </svg>
                              Convert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && meta.last_page > 1 && (
          <div className="px-5 py-3.5 border-t dark:border-navy-600/80 border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
            <p className="dark:text-text-muted text-gray-500 order-2 sm:order-1">
              Page <span className="font-medium dark:text-text-primary text-gray-900">{meta.current_page}</span> of{' '}
              <span className="font-medium dark:text-text-primary text-gray-900">{meta.last_page}</span>
              {meta.total != null && <> · {meta.total} total</>}
            </p>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => fetchLeads(meta.current_page - 1)}
                className="px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/60 bg-white dark:text-text-primary text-gray-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:dark:bg-navy-700/60 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => fetchLeads(meta.current_page + 1)}
                className="px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/60 bg-white dark:text-text-primary text-gray-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:dark:bg-navy-700/60 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Convert to Client Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h3 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-2">Convert Lead to Client</h3>
            <p className="text-sm dark:text-text-muted text-gray-500 mb-4">
              Are you sure you want to convert <span className="font-medium dark:text-text-primary text-gray-900">{selectedLead.name}</span> to a client?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConvert}
                className="flex-1 btn-primary"
              >
                Yes, Convert
              </button>
              <button
                onClick={() => { setShowConvertModal(false); setSelectedLead(null); }}
                className="flex-1 px-4 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-text-primary text-gray-900">Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 dark:text-text-muted text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-text-muted text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-text-muted text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-text-muted text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-text-muted text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-text-muted text-gray-700">Service Interested In</label>
                  <select
                    value={newLead.service_id}
                    onChange={(e) => setNewLead({ ...newLead, service_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-text-muted text-gray-700">Initial Status</label>
                  <select
                    value={newLead.status}
                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="follow_back">Follow Back</option>
                    <option value="hold">Hold</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium dark:text-text-muted text-gray-700">Message / Requirement Details</label>
                <textarea
                  rows={4}
                  value={newLead.message}
                  onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                  placeholder="Describe what the lead is looking for..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary py-3 rounded-xl font-semibold shadow-lg shadow-accent/20">
                  Create Lead
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
