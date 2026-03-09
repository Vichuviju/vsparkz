import { useState, useEffect } from 'react';
import api from '../lib/api';

const GROUPS = ['general', 'integrations', 'queue', 'ai', 'branding'];

function SystemSettings() {
  const [group, setGroup] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ key: '', value: '', encrypt: false });
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    setError(null);
    api
      .get('/admin/system-settings', { params: { group } })
      .then(({ data }) => setSettings(data?.settings ?? {}))
      .catch(() => {
        setSettings({});
        setError('Failed to load settings.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, [group]);

  const openAdd = () => {
    setModal('add');
    setForm({ key: '', value: '', encrypt: false });
    setError(null);
  };

  const openEdit = (key, value) => {
    setModal('edit');
    setForm({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      encrypt: false,
    });
    setError(null);
  };

  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    let value = form.value.trim();
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch {
        setError('Invalid JSON for value.');
        setSaving(false);
        return;
      }
    }
    try {
      await api.put('/admin/system-settings', {
        key: form.key,
        group,
        value,
        encrypt: form.encrypt,
      });
      fetchSettings();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save setting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">System Config</h1>
      <p className="text-text-muted text-sm mb-4">
        Dynamic configuration (integrations, queue, AI, branding). Values are tenant-aware and cached.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              group === g
                ? 'bg-accent/20 border-accent/30 text-accent'
                : 'dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700 hover:bg-gray-100'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium text-text-primary">Group: {group}</h2>
            <button type="button" onClick={openAdd} className="btn-primary px-3 py-1.5 text-sm">
              + Add setting
            </button>
          </div>
          {Object.keys(settings).length === 0 ? (
            <p className="text-text-muted text-sm">No settings in this group yet. Add one below.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-navy-600">
                  <th className="text-left py-2 font-medium text-text-primary">Key</th>
                  <th className="text-left py-2 font-medium text-text-primary">Value</th>
                  <th className="text-right py-2 font-medium text-text-primary w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-navy-700">
                {Object.entries(settings).map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-2 font-mono text-text-primary">{k}</td>
                    <td className="py-2 text-text-muted max-w-md truncate">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(k, v)}
                        className="text-accent hover:underline text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {modal === 'add' ? 'Add setting' : 'Edit setting'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Key *</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  required
                  disabled={modal === 'edit'}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary disabled:opacity-70"
                  placeholder="e.g. app_name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Value (text or JSON) *</label>
                <textarea
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary font-mono text-sm"
                  placeholder='e.g. "My App" or {"enabled": true}'
                />
              </div>
              {modal === 'add' && (
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={form.encrypt}
                    onChange={(e) => setForm((f) => ({ ...f, encrypt: e.target.checked }))}
                  />
                  Encrypt value
                </label>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 rounded text-sm">
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

export default SystemSettings;
export { SystemSettings };
