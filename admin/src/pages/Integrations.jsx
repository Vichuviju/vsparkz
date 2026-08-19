import { useState, useEffect } from 'react';
import api from '../lib/api';

const INTEGRATIONS_LIST = [
  {
    id: 'meta_ads',
    title: 'Meta Ads',
    desc: 'Connect Facebook & Instagram ads. Sync campaigns, track pixel conversions, and monitor ad spend.',
    fields: [
      { key: 'pixel_id', label: 'Meta Pixel ID', type: 'text', placeholder: 'e.g. 1234567890123' },
      { key: 'access_token', label: 'Conversion API Access Token', type: 'password', placeholder: 'EAABw...' },
      { key: 'ad_account_id', label: 'Ad Account ID', type: 'text', placeholder: 'act_123456789' },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Business API',
    desc: 'Automate customer support notifications, send broadcast templates, and track delivery status.',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: 'e.g. 1092837465' },
      { key: 'waba_id', label: 'WhatsApp Business Account ID', type: 'text', placeholder: 'e.g. 9876543210' },
      { key: 'auth_token', label: 'System User Access Token', type: 'password', placeholder: 'EAAGy...' },
    ],
  },
  {
    id: 'ai_content',
    title: 'AI Content Assistant',
    desc: 'AI-driven content suggestions, copy writing helpers, strategy planner ideas, and automated captioning.',
    fields: [
      { key: 'openai_api_key', label: 'OpenAI API Key', type: 'password', placeholder: 'sk-proj-...' },
      { key: 'gemini_api_key', label: 'Gemini API Key', type: 'password', placeholder: 'AIzaSy...' },
      { key: 'default_provider', label: 'Default AI Provider', type: 'select', options: ['openai', 'gemini'] },
    ],
  },
  {
    id: 'automation',
    title: 'Automation & Webhooks',
    desc: 'Trigger-based webhook calls, automation workflow worker settings, and external notification hooks.',
    fields: [
      { key: 'webhook_url', label: 'Destination Webhook URL', type: 'url', placeholder: 'https://api.yourdomain.com/webhook' },
      { key: 'secret_key', label: 'Signing Secret Key', type: 'password', placeholder: 'whsec_...' },
      { key: 'retry_failed_jobs', label: 'Retry Failed Runs', type: 'checkbox' },
    ],
  },
];

export function Integrations() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    api
      .get('/admin/system-settings', { params: { group: 'integrations' } })
      .then(({ data }) => {
        setSettings(data?.settings ?? {});
      })
      .catch(() => {
        setError('Failed to load integration settings.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openConfigure = (integration) => {
    const existing = settings[integration.id] || {};
    const initial = {};
    integration.fields.forEach((f) => {
      initial[f.key] = existing[f.key] ?? (f.type === 'checkbox' ? false : f.type === 'select' ? f.options[0] : '');
    });
    setFormValues(initial);
    setActiveModal(integration);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put('/admin/system-settings', {
        key: activeModal.id,
        group: 'integrations',
        value: formValues,
        encrypt: true,
      });
      setSuccess(`${activeModal.title} configuration saved successfully.`);
      fetchSettings();
      setTimeout(() => setActiveModal(null), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key, val) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-slate-800">Integrations</h1>
        <p className="text-text-muted dark:text-slate-600 mt-1">
          Connect and configure third-party services and APIs.
        </p>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm">
          {success}
        </div>
      )}
      {error && !activeModal && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INTEGRATIONS_LIST.map((integration) => {
            const isConfigured = Object.keys(settings[integration.id] || {}).length > 0;
            return (
              <div
                key={integration.id}
                className="bg-white dark:bg-navy-800/80 rounded-2xl shadow border border-slate-200 dark:border-navy-700 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="font-semibold dark:text-text-primary text-slate-800 text-lg">
                      {integration.title}
                    </h2>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        isConfigured
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {isConfigured ? 'Configured' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm mb-6 leading-relaxed">{integration.desc}</p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => openConfigure(integration)}
                    className="btn-primary px-4 py-2 text-sm w-full md:w-auto"
                  >
                    {isConfigured ? 'Edit Configuration' : 'Configure API'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-2">Configure {activeModal.title}</h2>
            <p className="text-xs text-text-muted mb-4">Values are stored securely and encrypted in transit & rest.</p>
            {error && (
              <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              {activeModal.fields.map((field) => (
                <div key={field.key}>
                  {field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm text-text-primary font-medium mt-2">
                      <input
                        type="checkbox"
                        checked={!!formValues[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        className="rounded border-navy-600 text-accent focus:ring-accent"
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-text-primary mb-1">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary capitalize"
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border dark:border-navy-600 rounded text-sm text-text-primary"
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

export default Integrations;
