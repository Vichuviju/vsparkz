import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/admin/support-tickets/${id}`);
      setTicket(data);
    } catch (err) {
      console.error('Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      await api.post(`/admin/support-tickets/${id}/reply`, {
        message: replyMessage,
        is_internal: isInternal
      });
      setReplyMessage('');
      fetchTicket();
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/admin/support-tickets/${id}`, { status });
      fetchTicket();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center dark:text-text-muted">Loading ticket...</div>;
  if (!ticket) return <div className="p-8 text-center dark:text-text-muted">Ticket not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/support-tickets" className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors">
            <svg className="w-5 h-5 dark:text-text-muted text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold dark:text-text-primary text-gray-900">{ticket.subject}</h1>
            <p className="text-xs dark:text-text-muted text-gray-500">Ticket #{ticket.id} • Created by {ticket.creator?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={ticket.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary text-gray-900 text-sm outline-none"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            {ticket.replies?.map((reply) => (
              <div key={reply.id} className={`flex ${reply.is_internal ? 'justify-center' : ''}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  reply.is_internal 
                    ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 w-full'
                    : 'bg-white dark:bg-navy-800 border dark:border-navy-700 border-gray-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold dark:text-text-primary text-gray-900">
                      {reply.user?.name} {reply.is_internal && <span className="text-[10px] uppercase tracking-wider bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded ml-2">Internal Note</span>}
                    </span>
                    <span className="text-xs dark:text-text-muted text-gray-500">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm dark:text-text-primary text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {reply.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-6">
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows="5"
                className="w-full px-4 py-3 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800/50 bg-white dark:text-text-primary text-gray-900 outline-none resize-none focus:ring-2 focus:ring-accent/20"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm dark:text-text-muted text-gray-600 group-hover:dark:text-text-primary transition-colors">Internal Note (Private)</span>
                </label>
                <button type="submit" className="btn-primary px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-accent/20">
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-sm font-bold dark:text-text-primary text-gray-900 border-b dark:border-navy-700 border-gray-100 pb-2">Ticket Info</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs dark:text-text-muted text-gray-500 uppercase tracking-wider font-semibold">Priority</p>
                <p className="text-sm dark:text-text-primary text-gray-900 mt-0.5">{ticket.priority.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs dark:text-text-muted text-gray-500 uppercase tracking-wider font-semibold">Client</p>
                <p className="text-sm dark:text-text-primary text-gray-900 mt-0.5">{ticket.client?.company_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs dark:text-text-muted text-gray-500 uppercase tracking-wider font-semibold">Assigned To</p>
                <p className="text-sm dark:text-text-primary text-gray-900 mt-0.5">{ticket.assignee?.name || 'Unassigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
