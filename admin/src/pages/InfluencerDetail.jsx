import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export function InfluencerDetail() {
  const { id } = useParams();
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Weekly update form
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    engagement_rate: '',
    followers: '',
    instagram_followers: '',
    youtube_followers: '',
  });
  const [logging, setLogging] = useState(false);

  const fetchInfluencer = () => {
    setLoading(true);
    api.get(`/admin/influencers/${id}`).then(({ data }) => {
      setInfluencer(data);
      setLogForm({
        log_date: new Date().toISOString().split('T')[0],
        engagement_rate: data.engagement_rate ?? '',
        followers: data.followers ?? '',
        instagram_followers: data.instagram_followers ?? '',
        youtube_followers: data.youtube_followers ?? '',
      });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchInfluencer(); }, [id]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setLogging(true);
    try {
      await api.post(`/admin/influencers/${id}/engagement`, logForm);
      fetchInfluencer();
      setShowLogModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save log');
    } finally {
      setLogging(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading influencer details…</div>;
  if (error || !influencer) return <div className="p-8 text-center text-accent-bright">{error || 'Influencer not found'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/influencers" className="p-2 border border-navy-600 rounded-lg text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div className="flex items-center gap-3">
            {influencer.profile_image ? (
              <img src={influencer.profile_image} className="w-16 h-16 rounded-xl object-cover border-2 border-accent" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-navy-700 flex items-center justify-center text-2xl font-bold text-accent">{influencer.name.charAt(0)}</div>
            )}
            <div>
              <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">{influencer.name}</h1>
              <p className="text-sm text-text-muted">{influencer.content_category?.name || influencer.category || 'No category'}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLogModal(true)} className="btn-primary px-4 py-2 text-sm">Add Weekly Update</button>
        </div>
      </div>

      <div className="flex gap-1 border-b dark:border-navy-600 border-gray-200">
        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}>Profile Details</button>
        <button onClick={() => setActiveTab('engagement')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'engagement' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}>Engagement History</button>
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Metric Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-navy-800/50 border border-navy-600">
                  <div className="text-xs text-text-muted mb-1">Total Followers</div>
                  <div className="text-xl font-bold text-accent">{Number(influencer.followers ?? 0).toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-navy-800/50 border border-navy-600">
                  <div className="text-xs text-text-muted mb-1">Engagement Rate</div>
                  <div className="text-xl font-bold text-cyan-400">{influencer.engagement_rate ?? '0'}%</div>
                </div>
                <div className="p-3 rounded-xl bg-navy-800/50 border border-navy-600">
                  <div className="text-xs text-text-muted mb-1">Instagram</div>
                  <div className="text-xl font-bold text-pink-500">{Number(influencer.instagram_followers ?? 0).toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-navy-800/50 border border-navy-600">
                  <div className="text-xs text-text-muted mb-1">YouTube</div>
                  <div className="text-xl font-bold text-red-500">{Number(influencer.youtube_followers ?? 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Demographics & Reach</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider font-semibold">Audience Gender</label>
                  <div className="mt-2 flex items-center gap-2 h-4 bg-navy-700 rounded-full overflow-hidden">
                    <div style={{ width: `${influencer.male_percentage ?? 50}%` }} className="h-full bg-blue-500" />
                    <div style={{ width: `${influencer.female_percentage ?? 50}%` }} className="h-full bg-pink-500" />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-text-muted">
                    <span>Male: {influencer.male_percentage ?? '—'}%</span>
                    <span>Female: {influencer.female_percentage ?? '—'}%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-text-muted">Peak Time: </span>
                    <span className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.peak_time || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">Location Ratio: </span>
                    <span className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.location_ratio || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Pricing & Notes</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 border border-navy-600 rounded-xl bg-navy-800/30">
                  <div className="text-xs text-text-muted">Per Post</div>
                  <div className="font-bold text-text-primary">₹{Number(influencer.pricing_per_post ?? 0).toLocaleString()}</div>
                </div>
                <div className="text-center p-3 border border-navy-600 rounded-xl bg-navy-800/30">
                  <div className="text-xs text-text-muted">Per Reel</div>
                  <div className="font-bold text-text-primary">₹{Number(influencer.pricing_per_reel ?? 0).toLocaleString()}</div>
                </div>
                <div className="text-center p-3 border border-navy-600 rounded-xl bg-navy-800/30">
                  <div className="text-xs text-text-muted">Per Story</div>
                  <div className="font-bold text-text-primary">₹{Number(influencer.pricing_per_story ?? 0).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase font-semibold">Expected Growth Notes</label>
                <p className="mt-2 text-sm dark:text-text-muted text-gray-700 bg-navy-700/30 p-3 rounded-lg border border-navy-600/50 min-h-[60px]">{influencer.expected_growth_notes || 'No notes added yet.'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold dark:text-text-primary text-gray-900 uppercase tracking-wider mb-4 border-b border-navy-600 pb-2">Management</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-text-muted">Main Status</div>
                  <div className="text-sm font-medium text-accent">{influencer.status}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Work Status</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.work_status || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Growth Status</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.growth_status || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Assigned Team Member</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.assigned_member?.name || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Reporting Manager</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.reporting_manager?.name || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Enrolled Date</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.enrolled_at || '—'}</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold dark:text-text-primary text-gray-900 uppercase tracking-wider mb-4 border-b border-navy-600 pb-2">Contact Info</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-text-muted">Email</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900 break-all">{influencer.email || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Phone</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Location</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.location || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Language</div>
                  <div className="text-sm font-medium dark:text-text-primary text-gray-900">{influencer.language || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Log Date</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Total Followers</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Engagement Rate</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">YT / IG</th>
              </tr>
            </thead>
            <tbody>
              {influencer.engagement_logs?.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-text-muted text-center">No engagement logs yet</td></tr>
              ) : influencer.engagement_logs?.map((log) => (
                <tr key={log.id} className="border-t dark:border-navy-600 border-gray-200">
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900">{log.log_date}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{Number(log.followers ?? 0).toLocaleString()}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{log.engagement_rate}%</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">YT: {Number(log.youtube_followers ?? 0).toLocaleString()} | IG: {Number(log.instagram_followers ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6 border dark:border-navy-600 border-gray-200">
            <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Add Weekly Engagement Log</h2>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Log Date</label><input type="date" value={logForm.log_date} onChange={(e) => setLogForm((f) => ({ ...f, log_date: e.target.value }))} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Engagement Rate %</label><input type="number" step="0.01" value={logForm.engagement_rate} onChange={(e) => setLogForm((f) => ({ ...f, engagement_rate: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Total Followers</label><input type="number" value={logForm.followers} onChange={(e) => setLogForm((f) => ({ ...f, followers: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Instagram Followers</label><input type="number" value={logForm.instagram_followers} onChange={(e) => setLogForm((f) => ({ ...f, instagram_followers: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">YouTube Followers</label><input type="number" value={logForm.youtube_followers} onChange={(e) => setLogForm((f) => ({ ...f, youtube_followers: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={logging} className="btn-primary px-4 py-2 disabled:opacity-50">{logging ? 'Saving…' : 'Save Update'}</button>
                <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 hover:bg-navy-700/80">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
