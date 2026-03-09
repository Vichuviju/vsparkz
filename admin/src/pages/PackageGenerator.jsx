import { useEffect, useState } from 'react';
import api from '../lib/api';

const defaultForm = () => ({
  name: '',
  pricing_title: 'PRICING',
  limited_offer_text: '',
  sidebar_features: ['Digital Marketing Packages', 'Customizable Packages', 'Marketing Budget: As You Like'],
  payment_note: '',
  company_name: '',
  tagline: '',
  display_order: 0,
  is_active: true,
  combo_package_ids: [],
});

export function PackageGenerator() {
  const [items, setItems] = useState([]);
  const [comboPackages, setComboPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm());

  useEffect(() => {
    Promise.all([
      api.get('/admin/offer-documents').then(({ data }) => setItems(Array.isArray(data) ? data : [])),
      api.get('/admin/combo-packages').then(({ data }) => setComboPackages(Array.isArray(data) ? data : [])),
    ]).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        sidebar_features: Array.isArray(form.sidebar_features) ? form.sidebar_features : (form.sidebar_features || '').split('\n').map((s) => s.trim()).filter(Boolean),
      };
      if (editing) {
        await api.put(`/admin/offer-documents/${editing.id}`, payload);
      } else {
        await api.post('/admin/offer-documents', payload);
      }
      setShowModal(false);
      setEditing(null);
      setForm(defaultForm());
      const { data } = await api.get('/admin/offer-documents');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (doc) => {
    setEditing(doc);
    setForm({
      name: doc.name,
      pricing_title: doc.pricing_title ?? 'PRICING',
      limited_offer_text: doc.limited_offer_text ?? '',
      sidebar_features: Array.isArray(doc.sidebar_features) ? doc.sidebar_features : (doc.sidebar_features || '').split('\n').filter(Boolean),
      payment_note: doc.payment_note ?? '',
      company_name: doc.company_name ?? '',
      tagline: doc.tagline ?? '',
      display_order: doc.display_order ?? 0,
      is_active: !!doc.is_active,
      combo_package_ids: (doc.combo_packages || []).map((c) => c.id),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this package generator?')) return;
    try {
      await api.delete(`/admin/offer-documents/${id}`);
      setItems(items.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const websiteUrl = import.meta.env.VITE_WEBSITE_URL ||
    (window.location.port === '5173' ? `${window.location.protocol}//${window.location.hostname}:5174` : null) ||
    window.location.origin.replace(/admin\./, '') ||
    'http://localhost:5174';
  const openPreview = (doc) => window.open(`${websiteUrl}/pricing?offer=${doc.id}&preview=1`, '_blank');
  const handleDownloadPdf = async (doc) => {
    try {
      const { data } = await api.get(`/admin/offer-documents/${doc.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  const toggleCombo = (id) => {
    setForm((f) => ({
      ...f,
      combo_package_ids: f.combo_package_ids.includes(id)
        ? f.combo_package_ids.filter((x) => x !== id)
        : [...f.combo_package_ids, id],
    }));
  };

  const moveCombo = (index, dir) => {
    const arr = [...form.combo_package_ids];
    const ni = index + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[index], arr[ni]] = [arr[ni], arr[index]];
    setForm((f) => ({ ...f, combo_package_ids: arr }));
  };

  const featuresStr = Array.isArray(form.sidebar_features) ? form.sidebar_features.join('\n') : form.sidebar_features || '';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Package Generator</h1>
        <button type="button" className="btn-primary px-4 py-2" onClick={() => { setEditing(null); setForm(defaultForm()); setShowModal(true); }}>Add Package Generator</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? (
        <div className="p-8 text-center text-text-muted">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Name</th>
                <th className="px-5 py-3 text-text-muted font-medium">Packages</th>
                <th className="px-5 py-3 text-text-muted font-medium">Show to website</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-text-muted text-center">No package generators yet.</td></tr>
              ) : (
                items.map((doc) => (
                  <tr key={doc.id} className="border-t border-navy-600">
                    <td className="px-5 py-3 text-text-primary font-medium">{doc.name}</td>
                    <td className="px-5 py-3 text-text-muted">{(doc.combo_packages || []).length} combos</td>
                    <td className="px-5 py-3">{doc.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-3">
                      <button type="button" className="text-accent hover:text-accent-bright mr-2" onClick={() => openPreview(doc)}>Preview</button>
                      <button type="button" className="text-accent hover:text-accent-bright mr-2" onClick={() => handleDownloadPdf(doc)}>PDF</button>
                      <button type="button" className="text-accent hover:text-accent-bright mr-2" onClick={() => handleEdit(doc)}>Edit</button>
                      <button type="button" className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(doc.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="glass-card p-6 w-full max-w-2xl my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Package Generator</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Digital Marketing Pricing" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Pricing title</label>
                  <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.pricing_title} onChange={(e) => setForm({ ...form, pricing_title: e.target.value })} placeholder="PRICING" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Limited offer text</label>
                  <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.limited_offer_text} onChange={(e) => setForm({ ...form, limited_offer_text: e.target.value })} placeholder="LIMITED OFFER" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Company name</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Optional" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Tagline</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Optional" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Sidebar features (one per line)</label>
                <textarea className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" rows={4} value={featuresStr} onChange={(e) => setForm({ ...form, sidebar_features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} placeholder="Digital Marketing Packages&#10;Customizable Packages" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Payment note</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.payment_note} onChange={(e) => setForm({ ...form, payment_note: e.target.value })} placeholder="Optional" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-2">Select combo packages (order = column order)</label>
                <div className="border border-navy-600 rounded-vsparkz p-3 bg-navy-800/40 max-h-40 overflow-y-auto space-y-2">
                  {form.combo_package_ids.map((id, idx) => {
                    const pkg = comboPackages.find((p) => p.id === id);
                    return pkg ? (
                      <div key={id} className="flex items-center gap-2">
                        <button type="button" className="text-text-muted hover:text-text-primary" onClick={() => moveCombo(idx, -1)} disabled={idx === 0}>↑</button>
                        <button type="button" className="text-text-muted hover:text-text-primary" onClick={() => moveCombo(idx, 1)} disabled={idx === form.combo_package_ids.length - 1}>↓</button>
                        <span className="flex-1 text-text-primary">{pkg.name}</span>
                        <button type="button" className="text-accent-muted hover:text-accent-bright text-sm" onClick={() => toggleCombo(id)}>Remove</button>
                      </div>
                    ) : null;
                  })}
                  {comboPackages.filter((p) => !form.combo_package_ids.includes(p.id)).map((p) => (
                    <button key={p.id} type="button" className="block w-full text-left px-2 py-1 rounded hover:bg-navy-700/50 text-text-primary" onClick={() => toggleCombo(p.id)}>+ {p.name}</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-text-muted">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  Show to website (active)
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm(defaultForm()); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
