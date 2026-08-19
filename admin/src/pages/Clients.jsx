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

export function Clients() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [modal, setModal] = useState(null);
  
  const [form, setForm] = useState({ 
    company_name: '', 
    contact_name: '', 
    contact_title: 'Marketing Head', // default fallback title
    email: '', 
    phone: '', 
    source: 'Manual',
    status: 'Active',
    address: '', 
    tax_id: '', 
    notes: '' 
  });
  
  const [saving, setSaving] = useState(false);

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 10 };
    if (search) params.search = search;
    
    api.get('/admin/clients', { params })
      .then(({ data }) => {
        // Handle paginated responses or simple arrays
        const rawData = data.data ?? data;
        setList(Array.isArray(rawData) ? rawData : []);
        setMeta({ 
          current_page: data.current_page ?? 1, 
          last_page: data.last_page ?? 1, 
          total: data.total ?? rawData.length 
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const openCreate = () => {
    setModal('new');
    setForm({ 
      company_name: '', 
      contact_name: '', 
      contact_title: 'Marketing Head',
      email: '', 
      phone: '', 
      source: 'Manual',
      status: 'Active',
      address: '', 
      tax_id: '', 
      notes: '' 
    });
  };

  const openEdit = (row) => {
    setModal(row.id);
    setForm({
      company_name: row.company_name ?? '',
      contact_name: row.contact_name ?? '',
      contact_title: row.contact_title ?? 'Marketing Head',
      email: row.email ?? '',
      phone: row.phone ?? '',
      source: row.source ?? 'Manual',
      status: row.status ?? 'Active',
      address: row.address ?? '',
      tax_id: row.tax_id ?? '',
      notes: row.notes ?? '',
    });
  };

  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') await api.post('/admin/clients', form);
      else await api.put(`/admin/clients/${modal}`, form);
      fetchList(meta.current_page);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    try {
      await api.delete(`/admin/clients/${id}`);
      fetchList(meta.current_page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Filter lists locally based on selection dropdowns
  const filteredList = list.filter(item => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (sourceFilter && item.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Top Banner Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Clients</h1>
          <p className="mt-1 text-sm font-medium text-slate-400 dark:text-slate-500">
            Manage your clients and company relationships.
          </p>
        </div>
        <div>
          <button 
            type="button" 
            onClick={openCreate} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Client
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search input container */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); fetchList(1); }}>
            <input 
              type="text" 
              placeholder="Search company, contact, email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-white placeholder-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/50"
            />
          </form>
        </div>

        {/* Dropdowns & filter toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select 
            value={sourceFilter} 
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Sources</option>
            <option value="Manual">Manual</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filters
          </button>

          {/* Grid/List Switches */}
          <div className="flex items-center border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shrink-0">
            <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <button className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zm10.5 0A2.25 2.25 0 0116.5 3.75H18.75A2.25 2.25 0 0121 6v2.25a2.25 2.25 0 01-2.25 2.25H16.5a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm10.5 0a2.25 2.25 0 012.25-2.25H18.75A2.25 2.25 0 0121 15.75V18a2.25 2.25 0 01-2.25 2.25H16.5A2.25 2.25 0 0114.25 18v-2.25z" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-semibold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 mx-auto mb-4" />
            Loading clients database…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-left text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-slate-400 text-center font-bold">No clients found</td>
                  </tr>
                ) : (
                  filteredList.map((row, index) => {
                    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const companyInitial = row.company_name ? row.company_name.charAt(0).toUpperCase() : 'C';
                    
                    return (
                      <tr 
                        key={row.id} 
                        className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Company Detail with color avatar */}
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${avatarColor}`}>
                              {companyInitial}
                            </div>
                            <div>
                              <div className="text-slate-800 dark:text-white text-xs font-extrabold">{row.company_name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">V-Sparkz HQ</div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Name & Title */}
                        <td className="px-6 py-4">
                          <div className="text-slate-800 dark:text-white font-bold">{row.contact_name ?? '—'}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{row.contact_title ?? 'Marketing Head'}</div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">{row.email ?? '—'}</td>

                        {/* Phone */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">{row.phone ?? '—'}</td>

                        {/* Source column with vector icons */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                            {row.source === 'Website' ? (
                              <>
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.003 9.003 0 018.716 6.747M12 3a9.003 9.003 0 00-8.716 6.747M3 12h18" />
                                </svg>
                                Website
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                                Manual
                              </>
                            )}
                          </div>
                        </td>

                        {/* Status Pills */}
                        <td className="px-6 py-4">
                          {row.status === 'Inactive' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                              Inactive
                            </span>
                          ) : row.status === 'Pending' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Custom Action icons */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Link 
                              to={`/clients/${row.id}`} 
                              className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                              title="View Client Detail"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </Link>
                            
                            <button 
                              type="button" 
                              onClick={() => openEdit(row)} 
                              className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                              title="Edit Client"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </button>

                            <button 
                              type="button" 
                              onClick={() => handleDelete(row.id)} 
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                              title="Delete Client"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
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

        {/* Premium Pagination Bar */}
        {meta.last_page > 1 && (
          <div className="px-6 py-4.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/60">
            <span>
              Showing {((meta.current_page - 1) * 10) + 1} to {Math.min(meta.current_page * 10, meta.total)} of {meta.total} results
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                disabled={meta.current_page <= 1} 
                onClick={() => fetchList(meta.current_page - 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              {/* Pagination indicators */}
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => fetchList(pageNum)}
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
                onClick={() => fetchList(meta.current_page + 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            
            {/* page-size display dropdown */}
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[10px]">10 / page</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Modern Overlay Form Modal */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 my-8 border border-slate-100 dark:border-slate-800 shadow-2xl animate-fade-in max-h-[min(92dvh,44rem)] overflow-y-auto mx-3 sm:mx-auto">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-4">
              {modal === 'new' ? 'Add Client' : 'Edit Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Company Name *</label>
                <input 
                  type="text" 
                  value={form.company_name} 
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} 
                  required 
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Contact Name</label>
                  <input 
                    type="text" 
                    value={form.contact_name} 
                    onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Contact Title</label>
                  <input 
                    type="text" 
                    value={form.contact_title} 
                    onChange={(e) => setForm((f) => ({ ...f, contact_title: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                  <input 
                    type="text" 
                    value={form.phone} 
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Source</label>
                  <select 
                    value={form.source} 
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select 
                    value={form.status} 
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Address</label>
                <textarea 
                  value={form.address} 
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} 
                  rows={2} 
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100" 
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-5 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
