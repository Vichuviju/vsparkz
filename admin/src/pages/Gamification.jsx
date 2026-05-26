import { useState, useEffect } from 'react';
import api from '../lib/api';

export function Gamification() {
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBadge, setShowAddBadge] = useState(false);
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    points_required: 100
  });

  const fetchData = async () => {
    try {
      const [badgesRes, rewardsRes] = await Promise.all([
        api.get('/admin/gamification/badges'),
        api.get('/admin/gamification/rewards')
      ]);
      setBadges(badgesRes.data.data || []);
      setRewards(rewardsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch gamification data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBadge = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/gamification/badges', newBadge);
      setShowAddBadge(false);
      setNewBadge({ name: '', description: '', points_required: 100 });
      fetchData();
    } catch (err) {
      alert('Failed to add badge');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Gamification & Rewards</h1>
        <p className="text-sm dark:text-text-muted text-gray-500">Engage users with badges and unlockable rewards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold dark:text-text-primary text-gray-900">Badges</h2>
            <button
              onClick={() => setShowAddBadge(true)}
              className="text-accent hover:underline text-sm font-medium"
            >
              Add New Badge
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.length === 0 ? (
              <div className="glass-card p-6 text-center dark:text-text-muted col-span-full">No badges yet.</div>
            ) : (
              badges.map(badge => (
                <div key={badge.id} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold dark:text-text-primary text-gray-900">{badge.name}</p>
                    <p className="text-xs dark:text-text-muted text-gray-500">{badge.points_required} Points</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-text-primary text-gray-900">Rewards</h2>
          <div className="glass-card p-6 space-y-4">
            {rewards.length === 0 ? (
              <p className="text-center dark:text-text-muted text-sm">No rewards configured.</p>
            ) : (
              rewards.map(reward => (
                <div key={reward.id} className="flex items-center justify-between border-b dark:border-navy-700 border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium dark:text-text-primary text-gray-900">{reward.name}</p>
                    <p className="text-xs dark:text-text-muted text-gray-500">{reward.description}</p>
                  </div>
                  <span className="text-sm font-bold text-accent">{reward.points_cost} Pts</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddBadge && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-lg w-full p-8">
            <h3 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-6">Create Badge</h3>
            <form onSubmit={handleAddBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Badge Name</label>
                <input
                  type="text"
                  required
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Points Required</label>
                <input
                  type="number"
                  required
                  value={newBadge.points_required}
                  onChange={(e) => setNewBadge({ ...newBadge, points_required: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary outline-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl font-semibold">Save</button>
                <button type="button" onClick={() => setShowAddBadge(false)} className="flex-1 px-4 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary rounded-xl font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
