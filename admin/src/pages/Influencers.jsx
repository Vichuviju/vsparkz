import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Users, TrendingUp, Star, Clock, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import api from '../lib/api';

export function Influencers() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/influencers', { params }).then(({ data }) => {
      setList(data.data ?? data);
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this influencer?')) return;
    try {
      await api.delete(`/admin/influencers/${id}`);
      fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    'new': 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    'shortlisted': 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
    'assigned': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    'pending': 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
  };

  return (
    <div className="font-sans min-h-[calc(100vh-4rem)] bg-slate-50 p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">
            <span>Talent Management</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800">Influencers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Influencer Directory</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm">
            <Filter className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => navigate('/influencers/add')} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/30 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Influencer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Influencers</p>
            <h3 className="text-2xl font-black text-slate-900">{meta.total || 0}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Reach</p>
            <h3 className="text-2xl font-black text-slate-900">2.4M</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Campaigns</p>
            <h3 className="text-2xl font-black text-slate-900">12</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pending Review</p>
            <h3 className="text-2xl font-black text-slate-900">8</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchList(1); }} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, platform, or niche..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700" 
            />
          </form>
          <div className="flex items-center gap-3">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="assigned">Assigned</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Influencer Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Platform & Reach</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Engagement</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-semibold">Loading data...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold">No influencers found.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold">
                          {row.name ? row.name.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{row.name}</p>
                          <p className="text-xs font-semibold text-slate-500">{row.category || 'No Niche'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 capitalize">{row.platform || 'Unknown'}</p>
                      <p className="text-xs font-semibold text-slate-500">{row.followers ? Number(row.followers).toLocaleString() : '0'} Followers</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(row.engagement_rate || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{row.engagement_rate || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusColors[row.status] || statusColors['new']}`}>
                        {row.status || 'New'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/influencers/edit/${row.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500">
              Showing page {meta.current_page} of {meta.last_page} ({meta.total} records)
            </span>
            <div className="flex gap-2">
              <button 
                disabled={meta.current_page <= 1} 
                onClick={() => fetchList(meta.current_page - 1)} 
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <button 
                disabled={meta.current_page >= meta.last_page} 
                onClick={() => fetchList(meta.current_page + 1)} 
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
