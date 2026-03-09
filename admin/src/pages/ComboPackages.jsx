import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export function ComboPackages() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    discount_type: 'percent',
    discount_value: 0,
    is_active: true,
    items: [],
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/combo-packages').then(({ data }) => setItems(Array.isArray(data) ? data : [])),
      api.get('/admin/services').then(({ data }) => setServices(Array.isArray(data) ? data : [])),
      api.get('/admin/sub-services').then(({ data }) => setSubServices(Array.isArray(data) ? data : [])),
    ]).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  }, []);

  const fetchPreview = useCallback(async () => {
    if (form.items.length === 0) {
      setPreviewResult(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const { data } = await api.post('/admin/combo-packages/preview-calc', {
        items: form.items.map((it) => ({ sub_service_id: it.sub_service_id, quantity: it.quantity })),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
      });
      setPreviewResult(data);
    } catch {
      setPreviewResult(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [form.items, form.discount_type, form.discount_value]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const defaultForm = () => ({
    name: '',
    tagline: '',
    short_description: '',
    display_order: 0,
    discount_type: 'percent',
    discount_value: 0,
    is_active: true,
    items: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        tagline: form.tagline || null,
        short_description: form.short_description || null,
        display_order: form.display_order ?? 0,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        is_active: form.is_active,
        items: form.items.map((it) => ({ sub_service_id: it.sub_service_id, quantity: it.quantity })),
      };
      if (editing) {
        await api.put(`/admin/combo-packages/${editing.id}`, payload);
      } else {
        await api.post('/admin/combo-packages', payload);
      }
      setShowModal(false);
      setEditing(null);
      setForm(defaultForm());
      const { data } = await api.get('/admin/combo-packages');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = async (pkg) => {
    setEditing(pkg);
    const itemList = (pkg.items || [])
      .filter((it) => it.sub_service_id)
      .map((it) => ({ sub_service_id: it.sub_service_id, quantity: it.quantity ?? 1 }));
    setForm({
      name: pkg.name,
      tagline: pkg.tagline ?? '',
      short_description: pkg.short_description ?? '',
      display_order: pkg.display_order ?? 0,
      discount_type: pkg.discount_type,
      discount_value: pkg.discount_value,
      is_active: !!pkg.is_active,
      items: itemList,
    });
    setShowModal(true);
  };

  const frontendUrl = import.meta.env.VITE_WEBSITE_URL || (window.location.origin.replace(/admin\./, '') || 'http://localhost:5174');
  const openPreview = (id) => window.open(`${frontendUrl}/offers/${id}`, '_blank');
  const handleGeneratePdf = async (pkg) => {
    try {
      await api.post(`/admin/combo-packages/${pkg.id}/generate-pdf`);
      setItems(items.map((it) => (it.id === pkg.id ? { ...it, pdf_path: `offers/combo-${pkg.id}.pdf` } : it)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate PDF');
    }
  };
  const handleDownloadPdf = async (pkg) => {
    try {
      const { data } = await api.get(`/admin/combo-packages/${pkg.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this combo package?')) return;
    try {
      await api.delete(`/admin/combo-packages/${id}`);
      setItems(items.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleSubService = (subServiceId, checked) => {
    if (checked) {
      setForm((f) => ({
        ...f,
        items: [...f.items, { sub_service_id: subServiceId, quantity: 1 }],
      }));
    } else {
      setForm((f) => ({
        ...f,
        items: f.items.filter((it) => it.sub_service_id !== subServiceId),
      }));
    }
  };

  const setItemQuantity = (subServiceId, quantity) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it) =>
        it.sub_service_id === subServiceId ? { ...it, quantity: Math.max(1, parseInt(quantity, 10) || 1) } : it
      ),
    }));
  };

  const isSelected = (subServiceId) => form.items.some((it) => it.sub_service_id === subServiceId);
  const getQuantity = (subServiceId) => form.items.find((it) => it.sub_service_id === subServiceId)?.quantity ?? 1;

  const subServicesByService = services.map((s) => ({
    ...s,
    subServices: subServices.filter((ss) => ss.service_id === s.id),
  })).filter((s) => s.subServices.length > 0);

  const formatDuration = (dur) => {
    if (!dur || typeof dur !== 'object') return '—';
    return Object.entries(dur)
      .filter(([, v]) => v > 0)
      .map(([u, v]) => `${v} ${u}`)
      .join(', ') || '—';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Combo Packages</h1>
        <button className="btn-primary px-4 py-2" onClick={() => { setEditing(null); setForm(defaultForm()); setShowModal(true); }}>Add Package</button>
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
                <th className="px-5 py-3 text-text-muted font-medium">Discount</th>
                <th className="px-5 py-3 text-text-muted font-medium">Items</th>
                <th className="px-5 py-3 text-text-muted font-medium">Active</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-text-muted text-center">No combo packages yet.</td>
                </tr>
              ) : (
                items.map((pkg) => (
                  <tr key={pkg.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                    <td className="px-5 py-3 text-text-primary font-medium">{pkg.name}</td>
                    <td className="px-5 py-3 text-text-muted">
                      {pkg.discount_type === 'percent' ? `${pkg.discount_value}%` : `₹${pkg.discount_value}`}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {Array.isArray(pkg.items) ? pkg.items.length : 0} items
                    </td>
                    <td className="px-5 py-3 text-text-muted">{pkg.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-3">
                      <button type="button" className="text-accent hover:text-accent-bright mr-2" onClick={() => openPreview(pkg.id)}>Preview</button>
                      <button type="button" className="text-accent hover:text-accent-bright mr-2" onClick={() => handleDownloadPdf(pkg)}>PDF</button>
                      <button type="button" className="text-accent-muted hover:text-accent-bright mr-2" onClick={() => handleGeneratePdf(pkg)}>Save PDF</button>
                      <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handleEdit(pkg)}>Edit</button>
                      <button className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(pkg.id)}>Delete</button>
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
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Combo Package</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Tagline</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Optional" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Short description</label>
                <textarea className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" rows={2} value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} placeholder="Optional" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Display order</label>
                <input type="number" min={0} className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })} />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-2">Select subservices</label>
                <div className="space-y-3 max-h-48 overflow-y-auto border border-navy-600 rounded-vsparkz p-3 bg-navy-800/40">
                  {subServicesByService.map((s) => (
                    <div key={s.id}>
                      <div className="text-text-muted text-xs font-medium mb-1">{s.title}</div>
                      <div className="flex flex-wrap gap-2">
                        {s.subServices.map((ss) => (
                          <label key={ss.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isSelected(ss.id)}
                              onChange={(e) => toggleSubService(ss.id, e.target.checked)}
                            />
                            <span className="text-text-primary">{ss.name}</span>
                            {isSelected(ss.id) && (
                              <input
                                type="number"
                                min={1}
                                className="w-14 px-2 py-0.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-xs"
                                value={getQuantity(ss.id)}
                                onChange={(e) => setItemQuantity(ss.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Discount Type</label>
                  <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                    <option value="percent">Percent</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Discount Value</label>
                  <input type="number" min={0} step={form.discount_type === 'percent' ? 1 : 0.01} className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              {previewLoading && <div className="text-text-muted text-sm mb-2">Calculating…</div>}
              {previewResult && !previewLoading && (
                <div className="mb-4 p-3 rounded-vsparkz bg-navy-800/60 border border-navy-600 text-sm">
                  <div className="flex justify-between text-text-muted"><span>Subtotal</span> <span>₹{Number(previewResult.subtotal).toLocaleString()}</span></div>
                  <div className="flex justify-between text-text-muted"><span>Discount</span> <span>₹{Number(previewResult.discount).toLocaleString()}</span></div>
                  <div className="flex justify-between font-medium text-text-primary mt-1"><span>Total</span> <span>₹{Number(previewResult.total).toLocaleString()}</span></div>
                  {previewResult.total_duration && Object.keys(previewResult.total_duration).length > 0 && (
                    <div className="mt-2 text-text-muted">Estimated time: {formatDuration(previewResult.total_duration)}</div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="flex items-center gap-2 text-text-muted">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  Active
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
