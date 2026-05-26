import { useState, useEffect } from 'react';
import api from '../lib/api';

export function SmsMarketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    scheduled_at: ''
  });

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get('/admin/sms-campaigns');
      setCampaigns(data.data || []);
    } catch (err) {
      console.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/sms-campaigns', newCampaign);
      setShowAddModal(false);
      setNewCampaign({ name: '', message: '', scheduled_at: '' });
      fetchCampaigns();
    } catch (err) {
      alert('Failed to create campaign');
    }
  };

  const handleSend = async (id) => {
    try {
      await api.post(`/admin/sms-campaigns/${id}/send`);
      fetchCampaigns();
    } catch (err) {
      alert('Failed to send SMS');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">SMS Marketing</h1>
          <p className="text-sm dark:text-text-muted text-gray-500">Reach your clients instantly via SMS</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <p className="text-sm dark:text-text-muted text-gray-500 font-medium">Total Campaigns</p>
          <p className="text-3xl font-bold dark:text-text-primary text-gray-900 mt-1">{campaigns.length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm dark:text-text-muted text-gray-500 font-medium">Sent Successfully</p>
          <p className="text-3xl font-bold text-green-500 mt-1">{campaigns.filter(c => c.status === 'sent').length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm dark:text-text-muted text-gray-500 font-medium">Drafts / Scheduled</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">{campaigns.filter(c => c.status !== 'sent').length}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b dark:border-navy-700 border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Campaign Name</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-navy-700 divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-10 text-center dark:text-text-muted">Loading campaigns...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-10 text-center dark:text-text-muted">No campaigns found.</td></tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="dark:hover:bg-navy-800/50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium dark:text-text-primary text-gray-900">{campaign.name}</td>
                  <td className="px-6 py-4 dark:text-text-muted text-gray-600 text-sm truncate max-w-[200px]" title={campaign.message}>
                    {campaign.message}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-text-muted'
                    }`}>
                      {campaign.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-text-muted text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        className="text-accent hover:underline text-sm font-medium"
                      >
                        Send Now
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-lg w-full p-8">
            <h3 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-6">Create SMS Campaign</h3>
            <form onSubmit={handleAddCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 outline-none"
                  placeholder="e.g. Summer Promo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Message (Max 160 chars)</label>
                <textarea
                  required
                  maxLength="160"
                  rows="4"
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 outline-none resize-none"
                  placeholder="Hello, check out our new offer..."
                />
                <p className="text-[10px] dark:text-text-muted text-gray-500 mt-1 text-right">{newCampaign.message.length}/160</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl font-semibold">
                  Save Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
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
