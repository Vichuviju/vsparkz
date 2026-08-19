import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export function Invoices() {
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ client_id: '', number: '', items: [], subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0, status: 'draft', due_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/invoices', { params }).then(({ data }) => {
      setList(data.data ?? data);
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchList(); }, [statusFilter]);
  useEffect(() => { api.get('/admin/clients', { params: { per_page: 200 } }).then(({ data }) => setClients(data.data ?? data ?? [])).catch(() => setClients([])); }, []);

  const openCreate = () => { setModal('new'); setForm({ client_id: '', number: `INV-${Date.now()}`, items: [], subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0, status: 'draft', due_date: '' }); };
  const openEdit = (row) => { setModal(row.id); setForm({ client_id: row.client_id, number: row.number, items: row.items ?? [], subtotal: row.subtotal ?? 0, tax_rate: row.tax_rate ?? 0, tax_amount: row.tax_amount ?? 0, total: row.total ?? 0, status: row.status ?? 'draft', due_date: row.due_date ? row.due_date.slice(0, 10) : '' }); };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, client_id: parseInt(form.client_id, 10), subtotal: parseFloat(form.subtotal) || 0, tax_rate: parseFloat(form.tax_rate) || 0, tax_amount: parseFloat(form.tax_amount) || 0, total: parseFloat(form.total) || 0, due_date: form.due_date || null };
    try {
      if (modal === 'new') await api.post('/admin/invoices', payload);
      else await api.put(`/admin/invoices/${modal}`, payload);
      fetchList();
      closeModal();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => { if (!confirm('Delete this invoice?')) return; try { await api.delete(`/admin/invoices/${id}`); fetchList(); } catch (err) { setError(err.response?.data?.message || 'Failed to delete'); } };

  const totalAmount = list.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const paidAmount = list.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="font-sans max-w-[1600px] mx-auto p-4 md:p-8 bg-slate-50 min-h-screen">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Create, manage and track all your invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-md h-10 px-4 font-bold text-sm flex items-center transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-md h-10 px-4 font-bold text-sm flex items-center transition-colors">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            Filters
          </button>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow shadow-blue-500/20 h-10 px-4 flex items-center font-bold text-sm transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Add Invoice
            <svg className="w-3.5 h-3.5 ml-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Invoices</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{meta.total || list.length}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              16.2% <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
            </span>
            <svg className="w-16 h-6 text-blue-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 15 Q5 5, 10 10 T20 12 T30 5 T40 10 T50 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{totalAmount.toLocaleString('en-IN')}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              22.8% <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
            </span>
            <svg className="w-16 h-6 text-emerald-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 18 Q10 10, 20 15 T30 8 T40 12 T50 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paid Amount</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{paidAmount.toLocaleString('en-IN')}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              18.6% <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
            </span>
            <svg className="w-16 h-6 text-purple-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 15 Q10 5, 20 8 T30 15 T40 5 T50 10" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Amount</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{pendingAmount.toLocaleString('en-IN')}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500 flex items-center">
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
              8.4% <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
            </span>
            <svg className="w-16 h-6 text-orange-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 10 Q10 12, 20 10 T30 8 T40 10 T50 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overdue Invoices</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{list.filter(i => i.status === 'overdue').length}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500 flex items-center">
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
              33.3% <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
            </span>
            <svg className="w-16 h-6 text-cyan-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 15 Q10 5, 20 8 T30 15 T40 5 T50 10" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold">{error}</div>}
      
      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        
        {/* Table Top Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search invoice number, client..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-100 hover:border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 cursor-pointer appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_12px_center] bg-no-repeat transition-colors shadow-sm">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <select className="px-4 py-2 bg-white border border-slate-100 hover:border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_12px_center] bg-no-repeat transition-colors shadow-sm hidden md:block">
              <option value="">All Clients</option>
            </select>
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 ml-2 shadow-sm">
              <button className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200/50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
            </div>
          </div>
        </div>

        {loading ? <div className="p-12 text-center text-slate-400 font-bold">Loading records...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-slate-400 font-bold text-center">No invoices found</td></tr>
                ) : list.map((row) => {
                  const status = (row.status || 'draft').toLowerCase();
                  let badgeColor = 'bg-slate-50 text-slate-600';
                  if(status === 'paid') badgeColor = 'bg-emerald-50 text-emerald-600';
                  else if(status === 'sent') badgeColor = 'bg-blue-50 text-blue-600';
                  else if(status === 'draft') badgeColor = 'bg-sky-50 text-sky-600';
                  else if(status === 'overdue') badgeColor = 'bg-red-50 text-red-600';

                  // Calculate days left
                  let dueSubtext = 'No due date';
                  let dueColor = 'text-slate-400';
                  if(row.due_date) {
                    const due = new Date(row.due_date);
                    const now = new Date();
                    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                    if (status === 'paid') {
                      dueSubtext = 'Paid';
                      dueColor = 'text-emerald-500';
                    } else if (diffDays < 0) {
                      dueSubtext = `${Math.abs(diffDays)} days overdue`;
                      dueColor = 'text-red-500';
                    } else {
                      dueSubtext = `${diffDays} days left`;
                      dueColor = 'text-orange-500';
                    }
                  }

                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors last:border-0 bg-white">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 tracking-tight">{row.number}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">May 12, 2026</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 tracking-tight">{row.client?.company_name ?? 'Unknown Client'}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">{row.client?.contact_name ?? 'John Doe'}</div>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800 tracking-tight">₹{Number(row.total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-extrabold capitalize ${badgeColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <div>
                            <div className="font-bold text-slate-800 tracking-tight text-xs">{row.due_date ? new Date(row.due_date).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'}) : '—'}</div>
                            <div className={`text-[9px] font-extrabold mt-0.5 uppercase tracking-wider ${dueColor}`}>{dueSubtext}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <Link to={`/invoices/${row.id}`} className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="View">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          <button onClick={() => openEdit(row)} className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 transition-colors p-1" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            <span className="text-xs font-bold text-slate-400">
              Showing {list.length > 0 ? 1 : 0} to {list.length} of {meta.total || list.length} results
            </span>
            {meta.last_page > 1 && (
              <div className="flex items-center gap-1">
                <button type="button" disabled={meta.current_page <= 1} onClick={() => fetchList(meta.current_page - 1)} className="p-2 border border-slate-100 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm shadow-blue-500/20">{meta.current_page}</button>
                <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => fetchList(meta.current_page + 1)} className="p-2 border border-slate-100 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
            <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
              10 / page
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* Existing Modal logic (preserved functionality, slightly refined styling) */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-6">{modal === 'new' ? 'Add New Invoice' : 'Edit Invoice'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Client *</label>
                <select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat">
                  <option value="">Select a client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Invoice Number *</label>
                <input type="text" value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-bold tracking-tight focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subtotal</label>
                  <input type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm((f) => ({ ...f, subtotal: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tax Rate %</label>
                  <input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tax Amount</label>
                  <input type="number" step="0.01" value={form.tax_amount} onChange={(e) => setForm((f) => ({ ...f, tax_amount: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Amount</label>
                  <input type="number" step="0.01" value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-black focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:border-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-bold focus:border-blue-500 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat">
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/30 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
