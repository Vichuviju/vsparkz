import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [newTicket, setNewTicket] = useState({
    client_id: '',
    subject: '',
    priority: 'medium',
    message: ''
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/support-tickets', {
        params: { status: statusFilter }
      });
      setTickets(data.data || []);
    } catch (err) {
      setError('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/admin/clients');
      setClients(data.data || []);
    } catch (err) {
      console.error('Failed to fetch clients');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/support-tickets', newTicket);
      setShowAddModal(false);
      setNewTicket({ client_id: '', subject: '', priority: 'medium', message: '' });
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Support Tickets</h1>
          <p className="text-sm dark:text-text-muted text-gray-500">Manage client support requests</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b dark:border-navy-700 border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Ticket</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-navy-700 divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center dark:text-text-muted">Loading tickets...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center dark:text-text-muted">No tickets found.</td></tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="dark:hover:bg-navy-800/50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/support-tickets/${ticket.id}`} className="font-medium dark:text-text-primary text-gray-900 hover:text-accent transition-colors block">
                      {ticket.subject}
                    </Link>
                    <span className="text-xs dark:text-text-muted text-gray-500">#{ticket.id}</span>
                  </td>
                  <td className="px-6 py-4 dark:text-text-muted text-gray-600">
                    {ticket.client?.company_name || 'Individual'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      ticket.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-text-muted'
                    }`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      ticket.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-text-muted'
                    }`}>
                      {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-text-muted text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/support-tickets/${ticket.id}`} className="text-accent hover:underline text-sm font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-lg w-full p-8">
            <h3 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-6">Create New Support Ticket</h3>
            <form onSubmit={handleAddTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Client</label>
                <select
                  value={newTicket.client_id}
                  onChange={(e) => setNewTicket({ ...newTicket, client_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 outline-none"
                >
                  <option value="">Select Client (Optional)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 outline-none"
                  placeholder="What is the issue?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows="4"
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 outline-none resize-none"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl font-semibold">
                  Create Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
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
