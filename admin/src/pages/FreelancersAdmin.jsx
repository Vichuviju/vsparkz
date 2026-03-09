import { useEffect, useState } from 'react';
import api from '../lib/api';

export function FreelancersAdmin() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', skills: [], service_category_ids: [], pricing: [], portfolio_links: [], delivery_days: 7, commission_percent: 0, company_or_individual: 'individual', availability: 'available', is_active: true });

  useEffect(() => {
    api.get('/admin/freelancers')
      .then((r) => setList(r.data?.data ?? r.data ?? []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/freelancers/${editing.id}`, form);
      } else {
        await api.post('/admin/freelancers', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', email: '', phone: '', skills: [], service_category_ids: [], pricing: [], portfolio_links: [], delivery_days: 7, commission_percent: 0, company_or_individual: 'individual', availability: 'available', is_active: true });
      const { data } = await api.get('/admin/freelancers');
      setList(data?.data ?? data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      skills: Array.isArray(row.skills) ? row.skills : [],
      service_category_ids: Array.isArray(row.service_category_ids) ? row.service_category_ids : [],
      pricing: Array.isArray(row.pricing) ? row.pricing : [],
      portfolio_links: Array.isArray(row.portfolio_links) ? row.portfolio_links : [],
      delivery_days: row.delivery_days || 7,
      commission_percent: row.commission_percent || 0,
      company_or_individual: row.company_or_individual || 'individual',
      availability: row.availability || 'available',
      is_active: !!row.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this freelancer?')) return;
    try {
      await api.delete(`/admin/freelancers/${id}`);
      setList(list.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleView = async (row) => {
    try {
      const { data } = await api.get(`/admin/freelancers/${row.id}`);
      setDetail(data);
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load details');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Freelancers</h1>
        <button className="btn-primary px-4 py-2" onClick={() => setShowModal(true)}>Add Freelancer</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Name</th>
                <th className="px-5 py-3 text-text-muted font-medium">Email</th>
                <th className="px-5 py-3 text-text-muted font-medium">Delivery</th>
                <th className="px-5 py-3 text-text-muted font-medium">Commission</th>
                <th className="px-5 py-3 text-text-muted font-medium">Active</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-text-muted text-center">No freelancers yet.</td></tr> : list.map((row) => (
                <tr key={row.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 text-text-primary font-medium">{row.name}</td>
                  <td className="px-5 py-3 text-text-muted">{row.email ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{row.delivery_days ?? '—'} days</td>
                  <td className="px-5 py-3 text-text-muted">{row.commission_percent ?? 0}%</td>
                  <td className="px-5 py-3 text-text-muted">{row.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3">
                    <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handleView(row)}>View</button>
                    <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handleEdit(row)}>Edit</button>
                    <button className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(row.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Freelancer</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Phone</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Delivery Days</label>
                  <input type="number" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.delivery_days} onChange={e => setForm({...form, delivery_days: parseInt(e.target.value) || 7})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Commission %</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.commission_percent} onChange={e => setForm({...form, commission_percent: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Type</label>
                  <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.company_or_individual} onChange={e => setForm({...form, company_or_individual: e.target.value})}>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Availability</label>
                  <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.availability} onChange={e => setForm({...form, availability: e.target.value})}>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-text-muted">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                  Active
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm({ name: '', email: '', phone: '', skills: [], service_category_ids: [], pricing: [], portfolio_links: [], delivery_days: 7, commission_percent: 0, company_or_individual: 'individual', availability: 'available', is_active: true }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">Freelancer Details</h2>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-text-muted">Name:</span> <span className="text-text-primary">{detail.name}</span></div>
              <div><span className="font-medium text-text-muted">Email:</span> <span className="text-text-primary">{detail.email || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Phone:</span> <span className="text-text-primary">{detail.phone || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Delivery Days:</span> <span className="text-text-primary">{detail.delivery_days || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Commission:</span> <span className="text-text-primary">{detail.commission_percent || 0}%</span></div>
              <div><span className="font-medium text-text-muted">Type:</span> <span className="text-text-primary">{detail.company_or_individual || 'individual'}</span></div>
              <div><span className="font-medium text-text-muted">Availability:</span> <span className="text-text-primary">{detail.availability || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Active:</span> <span className="text-text-primary">{detail.is_active ? 'Yes' : 'No'}</span></div>
              <div><span className="font-medium text-text-muted">Skills:</span> <span className="text-text-primary">{Array.isArray(detail.skills) ? detail.skills.join(', ') : '—'}</span></div>
              <div><span className="font-medium text-text-muted">Portfolio:</span> <span className="text-text-primary">{Array.isArray(detail.portfolio_links) ? detail.portfolio_links.join(', ') : '—'}</span></div>
            </div>
            <div className="mt-6">
              <button className="btn-primary w-full" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
