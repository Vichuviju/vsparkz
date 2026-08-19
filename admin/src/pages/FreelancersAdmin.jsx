import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Briefcase, Star, Clock, DollarSign, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import api from '../lib/api';

export function FreelancersAdmin() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchList = () => {
    setLoading(true);
    api.get('/admin/freelancers')
      .then((r) => setList(r.data?.data ?? r.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this freelancer?')) return;
    try {
      await api.delete(`/admin/freelancers/${id}`);
      fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = list.filter(item => {
    if (search && !item.name?.toLowerCase().includes(search.toLowerCase()) && !item.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'active' && !item.is_active) return false;
    if (statusFilter === 'inactive' && item.is_active) return false;
    return true;
  });

  return (
    <div className="font-sans min-h-[calc(100vh-4rem)] bg-slate-50 p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">
            <span>Talent Management</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800">Freelancers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Freelancer Directory</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm">
            <Filter className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => navigate('/freelancers/add')} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/30 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Freelancer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Freelancers</p>
            <h3 className="text-2xl font-black text-slate-900">{list.length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Top Rated</p>
            <h3 className="text-2xl font-black text-slate-900">24</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Available Now</p>
            <h3 className="text-2xl font-black text-slate-900">{list.filter(l => l.availability !== 'unavailable').length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg Commission</p>
            <h3 className="text-2xl font-black text-slate-900">15%</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or skill..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700" 
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Freelancer Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Delivery & Comms</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-semibold">Loading data...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold">No freelancers found.</td></tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold">
                          {row.name ? row.name.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{row.name}</p>
                          <p className="text-xs font-semibold text-slate-500">{row.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{row.delivery_days || 7} Days</p>
                      <p className="text-xs font-semibold text-slate-500">{row.commission_percent || 0}% Commission</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">
                        {row.company_or_individual || 'Individual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.is_active ? (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 ring-1 ring-slate-400/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/freelancers/edit/${row.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
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

      </div>
    </div>
  );
}
