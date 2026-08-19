import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Edit2, MessageSquare, DollarSign } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

export function AssignedInfluencers() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review Form State
  const [reviewData, setReviewData] = useState({
    status: '',
    reviewerScore: '',
    feedback: '',
    requestedBudget: ''
  });

  const fetchInfluencers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/influencers');
      // In a real auth scenario, you would filter by assignedTo == currentUserId.
      // For now, we display all to simulate the view for an employee.
      setInfluencers(res.data.data || res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assigned influencers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const openReviewModal = (inf) => {
    setSelectedInfluencer(inf);
    setReviewData({
      status: inf.status || 'pending',
      reviewerScore: inf.meta?.reviewerScore || '',
      feedback: inf.meta?.feedback || '',
      requestedBudget: inf.meta?.requestedBudget || ''
    });
    setIsReviewModalOpen(true);
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveReview = async () => {
    try {
      const payload = {
        name: selectedInfluencer.name,
        status: reviewData.status,
        meta: {
          ...(selectedInfluencer.meta || {}),
          reviewerScore: reviewData.reviewerScore,
          feedback: reviewData.feedback,
          requestedBudget: reviewData.requestedBudget,
          adminApproval: reviewData.status === 'active' ? 'approved' : (reviewData.status === 'rejected' ? 'rejected' : 'pending')
        }
      };

      await api.put(`/admin/influencers/${selectedInfluencer.id}`, payload);
      toast.success('Influencer review saved successfully!');
      setIsReviewModalOpen(false);
      fetchInfluencers(); // refresh the list to show new status
    } catch (error) {
      console.error(error);
      toast.error('Failed to save review');
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Assigned Influencers Inbox</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Review profiles, negotiate budgets, and manage approvals.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search my influencers..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : influencers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">Inbox Empty</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">You have no influencers assigned to you for review right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {influencers.map(inf => (
            <div key={inf.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all group flex flex-col h-full">
              <div className="p-5 relative flex-1">
                <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  inf.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' :
                  inf.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                  inf.status === 'awaiting_active' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {inf.status === 'awaiting_active' ? 'Awaiting' : (inf.status || 'Pending')}
                </div>
                
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl font-black text-blue-500 shrink-0 border border-blue-100 shadow-sm">
                    {inf.name?.charAt(0) || '?'}
                  </div>
                  <div className="pr-16">
                    <h3 className="font-black text-slate-800 text-base truncate group-hover:text-blue-600 transition-colors">{inf.name}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5 truncate">
                      {inf.category || 'Uncategorized'} • {inf.meta?.city || inf.location || 'Unknown Location'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Followers</p>
                    <p className="text-sm font-black text-slate-700 mt-1">{inf.followers?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Review Score</p>
                    <p className="text-sm font-black text-amber-500 mt-1 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" /> {inf.meta?.reviewerScore || 'None'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-50 bg-slate-50/50 group-hover:bg-blue-50/50 transition-colors">
                <button 
                  onClick={() => openReviewModal(inf)}
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  Review Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && selectedInfluencer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <h2 className="text-xl font-black text-slate-800">Internal Review</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Analyzing: <span className="text-slate-800">{selectedInfluencer.name}</span></p>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Reference Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Platform</p>
                  <p className="font-bold text-slate-700 mt-1 text-sm">{selectedInfluencer.platform || 'Instagram'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Followers</p>
                  <p className="font-bold text-slate-700 mt-1 text-sm">{selectedInfluencer.followers?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quoted Min</p>
                  <p className="font-bold text-slate-700 mt-1 text-sm">₹{selectedInfluencer.meta?.instaMinBudget || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quoted Max</p>
                  <p className="font-bold text-slate-700 mt-1 text-sm">₹{selectedInfluencer.meta?.instaMaxBudget || 0}</p>
                </div>
              </div>

              {/* Review Inputs */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> Reviewer Score (1-10)</label>
                    <input 
                      type="number" 
                      min="1" max="10" 
                      name="reviewerScore" 
                      value={reviewData.reviewerScore} 
                      onChange={handleReviewChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      placeholder="e.g. 8"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-green-500" /> Propose Negotiated Rate</label>
                    <input 
                      type="number" 
                      name="requestedBudget" 
                      value={reviewData.requestedBudget} 
                      onChange={handleReviewChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      placeholder="Final Budget (₹)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Internal Notes / Feedback</label>
                  <textarea 
                    rows="3"
                    name="feedback" 
                    value={reviewData.feedback} 
                    onChange={handleReviewChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none"
                    placeholder="Document your review notes, negotiations, or why they are rejected..."
                  ></textarea>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-black text-slate-800 mb-3 uppercase tracking-wide">Final Decision / Workflow Status</label>
                  <select 
                    name="status" 
                    value={reviewData.status} 
                    onChange={handleReviewChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
                  >
                    <option value="pending">Pending Review (Action Required)</option>
                    <option value="awaiting_active">Awaiting Activation (Approved)</option>
                    <option value="active">Active (Live in System)</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 sticky bottom-0 rounded-b-3xl z-20">
              <a href={`/influencers/edit/${selectedInfluencer.id}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 group transition-colors">
                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Edit Core Profile Data
              </a>
              <div className="flex gap-3">
                <button onClick={() => setIsReviewModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                  Cancel
                </button>
                <button onClick={handleSaveReview} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                  Save Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
