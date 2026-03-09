import { useEffect, useState } from 'react';
import api from '../lib/api';

export function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => {
    api
      .get('/admin/settings')
      .then(({ data }) => setSettings(data || {}))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { settings };
      await api.put('/admin/settings', payload);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings & SEO</h1>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site name</label>
              <input
                type="text"
                value={settings.site_name ?? ''}
                onChange={(e) => handleChange('site_name', e.target.value)}
                placeholder="Vsparkz Digital"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.site_tagline ?? ''}
                onChange={(e) => handleChange('site_tagline', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site logo</label>
              <p className="text-xs text-slate-500 mb-2">Shown in the header and footer of the public website. Use a square or wide logo (PNG/SVG).</p>
              <div className="flex items-center gap-3 flex-wrap">
                {settings.logo_media_id ? (
                  <>
                    <span className="text-sm text-slate-600">Logo set (Media ID: {settings.logo_media_id})</span>
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Change logo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('logo_media_id', null)}
                      className="text-sm text-slate-500 hover:underline"
                    >
                      Remove logo
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                    className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200"
                  >
                    Pick logo from library
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Default SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta title</label>
              <input
                type="text"
                value={settings.meta_title ?? ''}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta description</label>
              <textarea
                value={settings.meta_description ?? ''}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta keywords</label>
              <input
                type="text"
                value={settings.meta_keywords ?? ''}
                onChange={(e) => handleChange('meta_keywords', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Contact</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact email</label>
              <input
                type="email"
                value={settings.contact_email ?? ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact phone</label>
              <input
                type="text"
                value={settings.contact_phone ?? ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Footer text</label>
              <textarea
                value={settings.footer_text ?? ''}
                onChange={(e) => handleChange('footer_text', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
      {mediaPickerOpen && (
        <MediaLibraryModal
          onSelect={(media) => {
            handleChange('logo_media_id', media?.id ?? null);
            setMediaPickerOpen(false);
          }}
          onClose={() => setMediaPickerOpen(false)}
        />
      )}
    </div>
  );
}

function MediaLibraryModal({ onSelect, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/media', { params: { per_page: 48, search } })
      .then((res) => {
        const d = res?.data;
        setList(Array.isArray(d) ? d : (d?.data ?? []));
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Select logo image</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4"
        />
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 overflow-y-auto flex-1">
            {list.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                className="rounded-lg border border-slate-200 overflow-hidden hover:border-indigo-500 text-left"
              >
                {m.mime_type?.startsWith('image/') ? (
                  <img src={m.url} alt={m.filename} className="w-full aspect-square object-contain bg-slate-50" />
                ) : (
                  <div className="w-full aspect-square bg-slate-100 flex items-center justify-center text-slate-500 text-xs p-1">{m.filename}</div>
                )}
                <span className="block text-xs text-slate-600 truncate p-1">{m.filename}</span>
              </button>
            ))}
            {list.length === 0 && <p className="col-span-full text-slate-500 text-sm">No media. Upload an image in Landing Page Builder → Pick from library → Upload new.</p>}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}
