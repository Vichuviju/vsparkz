import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function StrategyPlanner() {
  const { isAuthenticated } = useAuth();
  const [businessType, setBusinessType] = useState('');
  const [goals, setGoals] = useState('');
  const [budget, setBudget] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runPlanner = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post('/tools/strategy-planner', {
        business_type: businessType.trim(),
        goals: goals.trim() || undefined,
        budget: budget.trim() || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to generate plan');
      if (err.response?.data?.requires_subscription) {
        setError('Free use limit reached. Please subscribe for more plans.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Strategy Planner</h1>
        <p className="text-text-muted mb-6">Enter your business type and goals to get a phased strategy outline.</p>
        {!isAuthenticated && (
          <p className="mb-4 p-3 rounded-vsparkz bg-accent/10 border border-accent/20 text-accent-bright text-sm">
            <Link to="/login" className="underline">Log in</Link> or <Link to="/register" className="underline">sign up</Link> for 1 free plan per account.
          </p>
        )}
        {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
        <form onSubmit={runPlanner} className="space-y-4 mb-6">
          <div>
            <label className="block text-text-muted text-sm mb-1.5">Business type *</label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. E-commerce, SaaS, Local service"
              className="w-full px-4 py-2.5 rounded-vsparkz border border-surface-border bg-navy-800/80 text-text-primary placeholder-text-secondary focus:border-accent focus:ring-1 focus:ring-accent/30"
              required
            />
          </div>
          <div>
            <label className="block text-text-muted text-sm mb-1.5">Goals (optional)</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. Grow awareness, generate leads"
              className="w-full px-4 py-2.5 rounded-vsparkz border border-surface-border bg-navy-800/80 text-text-primary placeholder-text-secondary focus:border-accent focus:ring-1 focus:ring-accent/30"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-text-muted text-sm mb-1.5">Budget (optional)</label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 10k/month"
              className="w-full px-4 py-2.5 rounded-vsparkz border border-surface-border bg-navy-800/80 text-text-primary placeholder-text-secondary focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-5 py-2.5 disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate plan'}
          </button>
        </form>
        {result && (
          <div className="glass-card p-5 animate-fade-in">
            <h2 className="font-semibold text-text-primary mb-2">Your strategy outline</h2>
            <p className="text-text-muted text-sm">Business: {result.business_type}</p>
            {result.goals && <p className="text-text-muted text-sm mt-1">Goals: {result.goals}</p>}
            {result.budget && <p className="text-text-muted text-sm mt-1">Budget: {result.budget}</p>}
            <div className="mt-4 space-y-3">
              {result.phases?.map((p) => (
                <div key={p.phase} className="border border-surface-border rounded-vsparkz p-3 bg-navy-800/40">
                  <div className="font-medium text-text-primary">Phase {p.phase}: {p.name}</div>
                  <div className="text-text-muted text-sm">Duration: {p.duration}</div>
                  <ul className="text-text-muted text-sm list-disc list-inside mt-1">
                    {p.actions?.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
