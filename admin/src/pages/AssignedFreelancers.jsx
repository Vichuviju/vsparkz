import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Edit2, MessageSquare, DollarSign, Briefcase } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

export function AssignedFreelancers() {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review Form State
  const [reviewData, setReviewData] = useState({
    status: '',
    internalScore: '',
    feedback: '',
    requestedBudget: ''
  });

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/freelancers');
      // In a real auth scenario, you would filter by assignedManager == currentUserId.
      setFreelancers(res.data.data || res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assigned freelancers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const openReviewModal = (freelancer) => {
    setSelectedFreelancer(freelancer);
    const pricing = freelancer.pricing || {};
    // Determine pseudo-status based on is_active and approvalStatus
    let currentStatus = 'pending';
    if (freelancer.is_active && pricing.approvalStatus === 'approved') currentStatus = 'active';
    else if (pricing.approvalStatus === 'awaiting_active') currentStatus = 'awaiting_active';
    else if (pricing.approvalStatus === 'rejected') currentStatus = 'rejected';

    setReviewData({
      status: currentStatus,
      internalScore: pricing.internalScore || '',
      feedback: pricing.feedback || '',
      requestedBudget: pricing.requestedBudget || ''
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
        name: selectedFreelancer.name,
        is_active: reviewData.status === 'active' || reviewData.status === 'awaiting_active',
        pricing: {
          ...(selectedFreelancer.pricing || {}),
          internalScore: reviewData.internalScore,
          feedback: reviewData.feedback,
          requestedBudget: reviewData.requestedBudget,
          approvalStatus: reviewData.status === 'active' ? 'approved' : (reviewData.status === 'awaiting_active' ? 'awaiting_active' : (reviewData.status === 'rejected' ? 'rejected' : 'pending'))
        }
      };

      await api.put(`/admin/freelancers/${selectedFreelancer.id}`, payload);
      toast.success('Freelancer review saved successfully!');
      setIsReviewModalOpen(false);
      fetchFreelancers(); // refresh the list to show new status
    } catch (error) {
      console.error(error);
      toast.error('Failed to save review');
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Assigned Freelancers Inbox</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Review portfolios, negotiate rates, and manage approvals.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search my freelancers..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : freelancers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">Inbox Empty</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">You have no freelancers assigned to you for review right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {freelancers.map(freelancer => {
            const pricing = freelancer.pricing || {};
            let displayStatus = 'Pending';
            let statusColor = 'bg-slate-100 text-slate-600 border border-slate-200';
            
            if (freelancer.is_active && pricing.approvalStatus === 'approved') {
              displayStatus = 'Active';
              statusColor = 'bg-green-100 text-green-700 border border-green-200';
            } else if (pricing.approvalStatus === 'awaiting_active') {
              displayStatus = 'Awaiting';
              statusColor = 'bg-amber-100 text-amber-700 border border-amber-200';
            } else if (pricing.approvalStatus === 'rejected') {
              displayStatus = 'Rejected';
              statusColor = 'bg-red-100 text-red-700 border border-red-200';
            }

            return (
              <div key={freelancer.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-purple-900/5 transition-all group flex flex-col h-full">
                <div className="p-5 relative flex-1">
                  <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                    {displayStatus}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-xl font-black text-purple-500 shrink-0 border border-purple-100 shadow-sm">
                      {freelancer.name?.charAt(0) || '?'}
                    </div>
                    <div className="pr-16">
                      <h3 className="font-black text-slate-800 text-base truncate group-hover:text-purple-600 transition-colors">{freelancer.name}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-0.5 truncate">
                        {Array.isArray(freelancer.skills) && typeof freelancer.skills[0] === 'object' ? freelancer.skills[0].name : (Array.isArray(freelancer.skills) ? freelancer.skills[0] : 'Freelancer')} • {pricing.city || 'Unknown Location'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Primary Rate</p>
                      <p className="text-sm font-black text-slate-700 mt-1">₹{Array.isArray(freelancer.skills) && typeof freelancer.skills[0] === 'object' ? freelancer.skills[0].rate : 0}</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Review Score</p>
                      <p className="text-sm font-black text-amber-500 mt-1 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" /> {pricing.internalScore || 'None'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-50 bg-slate-50/50 group-hover:bg-purple-50/50 transition-colors">
                  <button 
                    onClick={() => openReviewModal(freelancer)}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:border-purple-300 hover:text-purple-600 transition-all"
                  >
                    Review Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && selectedFreelancer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <h2 className="text-xl font-black text-slate-800">Internal Review</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Analyzing: <span className="text-slate-800">{selectedFreelancer.name}</span></p>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Reference Metrics */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Skill Pricing Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(selectedFreelancer.skills) && typeof selectedFreelancer.skills[0] === 'object' ? (
                    selectedFreelancer.skills.map((skill, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{skill.billingType === 'hourly' ? 'Hourly' : skill.billingType === 'project' ? 'Per Project' : 'Retainer'}</p>
                        <p className="font-bold text-slate-700 text-sm truncate">{skill.name}</p>
                        <p className="font-black text-blue-600 mt-1 text-base">₹{skill.rate}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-full">
                      <p className="text-sm font-bold text-slate-500">No dynamic skill pricing found for this freelancer.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Inputs */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> Internal Score (1-10)</label>
                    <input 
                      type="number" 
                      min="1" max="10" 
                      name="internalScore" 
                      value={reviewData.internalScore} 
                      onChange={handleReviewChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                      placeholder="Final Budget (₹)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-purple-500" /> Internal Notes / Feedback</label>
                  <textarea 
                    rows="3"
                    name="feedback" 
                    value={reviewData.feedback} 
                    onChange={handleReviewChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm resize-none"
                    placeholder="Document your review notes, negotiations, or why they are rejected..."
                  ></textarea>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-black text-slate-800 mb-3 uppercase tracking-wide">Final Decision / Workflow Status</label>
                  <select 
                    name="status" 
                    value={reviewData.status} 
                    onChange={handleReviewChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm"
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
              <a href={`/freelancers/edit/${selectedFreelancer.id}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1.5 group transition-colors">
                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Edit Core Profile Data
              </a>
              <div className="flex gap-3">
                <button onClick={() => setIsReviewModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                  Cancel
                </button>
                <button onClick={handleSaveReview} className="px-6 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-95">
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
