import { useEffect, useState } from 'react';
import api from '../lib/api';

export function ServicePrices() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [pricingLevels, setPricingLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ service_id: '', pricing_level_id: '', amount: '', duration_value: 30, duration_unit: 'days' });

  useEffect(() => {
    Promise.all([
      api.get('/admin/services').then(r => setServices(Array.isArray(r.data) ? r.data : [])),
      api.get('/admin/pricing-levels').then(r => setPricingLevels(Array.isArray(r.data) ? r.data : [])),
      api.get('/admin/service-prices')
        .then(r => setItems(Array.isArray(r.data) ? r.data : []))
        .catch(err => setError(err.response?.data?.message || 'Failed'))
    ]).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/service-prices/${editing.id}`, form);
      } else {
        await api.post('/admin/service-prices', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ service_id: '', pricing_level_id: '', amount: '', duration_value: 30, duration_unit: 'days' });
      const { data } = await api.get('/admin/service-prices');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (it) => {
    setEditing(it);
    setForm({ service_id: it.service_id, pricing_level_id: it.pricing_level_id, amount: it.amount, duration_value: it.duration_value || 30, duration_unit: it.duration_unit || 'days' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this price?')) return;
    try {
      await api.delete(`/admin/service-prices/${id}`);
      setItems(items.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getServiceName = (id) => services.find(s => s.id === id)?.title ?? id;
  const getLevelLabel = (id) => pricingLevels.find(l => l.id === id)?.label ?? id;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Service Prices</h1>
        <button className="btn-primary px-4 py-2" onClick={() => setShowModal(true)}>Add Price</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Service</th>
                <th className="px-5 py-3 text-text-muted font-medium">Level</th>
                <th className="px-5 py-3 text-text-muted font-medium">Amount</th>
                <th className="px-5 py-3 text-text-muted font-medium">Frequency</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-text-muted text-center">No prices yet.</td></tr>
              ) : items.map((it) => (
                <tr key={it.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 text-text-primary">{getServiceName(it.service_id)}</td>
                  <td className="px-5 py-3 text-text-muted">{getLevelLabel(it.pricing_level_id)}</td>
                  <td className="px-5 py-3 font-medium text-text-primary">{it.amount}</td>
                  <td className="px-5 py-3 text-text-muted">{it.duration_value} {it.duration_unit}</td>
                  <td className="px-5 py-3">
                    <button className="text-accent hover:text-accent-bright mr-3" onClick={() => handleEdit(it)}>Edit</button>
                    <button className="text-red-400 hover:text-red-300" onClick={() => handleDelete(it.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Service Price</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Service</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} required>
                  <option value="">Select Service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Pricing Level</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.pricing_level_id} onChange={e => setForm({...form, pricing_level_id: e.target.value})} required>
                  <option value="">Select Level</option>
                  {pricingLevels.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Amount</label>
                <input type="number" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Duration Value</label>
                  <input type="number" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.duration_value} onChange={e => setForm({...form, duration_value: parseInt(e.target.value) || 30})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Unit</label>
                  <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.duration_unit} onChange={e => setForm({...form, duration_unit: e.target.value})}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm({ service_id: '', pricing_level_id: '', amount: '', duration_value: 30, duration_unit: 'days' }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
