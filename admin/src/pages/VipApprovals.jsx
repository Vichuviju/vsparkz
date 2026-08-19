import React, { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, Search, User, Crown, Mail, Calendar, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

export function VipApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/vip-requests');
      setRequests(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load VIP requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/vip-requests/${id}/approve`, { comments: 'Approved by Super Admin' });
      toast.success('VIP Account Approved & Activated!', { icon: <Crown className="w-4 h-4 text-amber-500" /> });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve VIP user');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return; // User cancelled
    
    try {
      await api.post(`/admin/vip-requests/${id}/reject`, { rejection_reason: reason || 'Not eligible at this time.' });
      toast.error('VIP Request Denied.');
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject VIP request');
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative z-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" /> VIP Enterprise Approvals
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Review and authorize exclusive system access requests.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search requests..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <ShieldCheck className="w-8 h-8 text-amber-300" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">No Pending Approvals</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">All VIP access requests have been cleared.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-amber-900/5 transition-all group flex flex-col h-full relative">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              
              <div className="p-6 relative flex-1 z-10">
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                  Requires Action
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xl font-black text-amber-400 shrink-0 shadow-lg border-2 border-white">
                    {req.name?.charAt(0) || '?'}
                  </div>
                  <div className="pr-16">
                    <h3 className="font-black text-slate-800 text-lg truncate">{req.name}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                      {req.role || 'User'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{req.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Requested: {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex gap-3 z-10">
                <button 
                  onClick={() => handleReject(req.id)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleApprove(req.id)}
                  className="flex-1 py-2.5 bg-slate-800 text-amber-400 border border-slate-800 rounded-xl text-sm font-bold shadow-lg shadow-slate-800/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve VIP
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
