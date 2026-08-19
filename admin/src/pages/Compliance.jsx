import { useState, useEffect } from 'react';
import api from '../lib/api';

function Compliance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const [ndas, setNdas] = useState([]);
  const [gdpr, setGdpr] = useState([]);
  const [exportsList, setExportsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [exportType, setExportType] = useState('full');
  const [entityType, setEntityType] = useState('contacts');
  const [exporting, setExporting] = useState(false);

  const fetchTabDetails = (tab) => {
    setLoading(true);
    setError(null);
    let endpoint = '';
    if (tab === 'audit') endpoint = '/admin/compliance/audit-logs';
    else if (tab === 'ndas') endpoint = '/admin/compliance/ndas';
    else if (tab === 'gdpr') endpoint = '/admin/compliance/gdpr';
    else if (tab === 'exports') endpoint = '/admin/compliance/exports';

    if (!endpoint) {
      setLoading(false);
      return;
    }

    api
      .get(endpoint)
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        if (tab === 'audit') setLogs(Array.isArray(d) ? d : []);
        else if (tab === 'ndas') setNdas(Array.isArray(d) ? d : []);
        else if (tab === 'gdpr') setGdpr(Array.isArray(d) ? d : []);
        else if (tab === 'exports') setExportsList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setError(`Failed to load compliance data for tab: ${tab}`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTabDetails(activeTab);
  }, [activeTab]);

  const handleTriggerExport = async (e) => {
    e.preventDefault();
    setExporting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/admin/compliance/export', {
        export_type: exportType,
        entity_type: entityType,
      });
      setSuccess('Data export log generated and logged successfully.');
      fetchTabDetails('exports');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger data export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">Audit & Compliance</h1>
        <p className="text-text-muted text-sm">Monitor activity logs, NDA agreements, GDPR consents, and database exports.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b dark:border-navy-700 pb-2">
        {['overview', 'audit', 'ndas', 'gdpr', 'exports'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition capitalize ${
              activeTab === tab
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'text-text-muted hover:text-text-primary hover:bg-gray-100 dark:hover:bg-navy-800'
            }`}
          >
            {tab === 'ndas' ? 'NDA documents' : tab === 'gdpr' ? 'GDPR consents' : tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="glass-card rounded-2xl p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-semibold text-text-primary text-lg">System Governance & Policy Overview</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                The V-Sparkz platform enforces tenant-level isolation and strict security regulations. Key modules are tracked dynamically:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border dark:border-navy-700 dark:bg-navy-900/40">
                  <h4 className="font-medium text-text-primary mb-1">Automatic Auditing</h4>
                  <p className="text-text-muted text-xs leading-relaxed">Key entity creation, data access, role changes, and data modifications are saved automatically to the audit log.</p>
                </div>
                <div className="p-4 rounded-xl border dark:border-navy-700 dark:bg-navy-900/40">
                  <h4 className="font-medium text-text-primary mb-1">NDA Agreements</h4>
                  <p className="text-text-muted text-xs leading-relaxed">Allows legal operations to track signed NDA templates and effective coverage dates for clients and contractors.</p>
                </div>
                <div className="p-4 rounded-xl border dark:border-navy-700 dark:bg-navy-900/40">
                  <h4 className="font-medium text-text-primary mb-1">GDPR & Contact Consent</h4>
                  <p className="text-text-muted text-xs leading-relaxed">Records subscriber double opt-ins, registration sources, and consent revocation states.</p>
                </div>
                <div className="p-4 rounded-xl border dark:border-navy-700 dark:bg-navy-900/40">
                  <h4 className="font-medium text-text-primary mb-1">Data Retention Engine</h4>
                  <p className="text-text-muted text-xs leading-relaxed">Monitors compliance policies and automatically filters expired lead data, invoices, or activity logs.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h3 className="font-semibold text-text-primary text-lg mb-3">Activity & Audit Log</h3>
              <div className="overflow-x-auto rounded-xl border dark:border-navy-700">
                <table className="w-full text-sm">
                  <thead className="dark:bg-navy-800/50 bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Time</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Action</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Auditable Type</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">User</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-navy-700">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                          No audit log entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="dark:hover:bg-navy-800/50">
                          <td className="px-4 py-3 text-text-muted">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium text-accent capitalize">{log.action?.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-text-muted font-mono text-xs">{log.auditable_type?.split('\\').pop() ?? '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{log.user?.name ?? 'System'}</td>
                          <td className="px-4 py-3 text-text-muted">{log.ip_address ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ndas' && (
            <div>
              <h3 className="font-semibold text-text-primary text-lg mb-3">NDA Documents</h3>
              <div className="overflow-x-auto rounded-xl border dark:border-navy-700">
                <table className="w-full text-sm">
                  <thead className="dark:bg-navy-800/50 bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Client</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Effective From</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Effective To</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-navy-700">
                    {ndas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                          No signed NDAs registered.
                        </td>
                      </tr>
                    ) : (
                      ndas.map((nda) => (
                        <tr key={nda.id} className="dark:hover:bg-navy-800/50">
                          <td className="px-4 py-3 font-medium">{nda.client?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{nda.effective_from ?? '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{nda.effective_to ?? '—'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600 dark:text-green-400 capitalize">
                              {nda.status ?? 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'gdpr' && (
            <div>
              <h3 className="font-semibold text-text-primary text-lg mb-3">GDPR Consent Database</h3>
              <div className="overflow-x-auto rounded-xl border dark:border-navy-700">
                <table className="w-full text-sm">
                  <thead className="dark:bg-navy-800/50 bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Contact / Lead</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Purpose</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Granted</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Source</th>
                      <th className="text-left px-4 py-3 font-medium text-text-primary">Granted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-navy-700">
                    {gdpr.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                          No consent logs registered.
                        </td>
                      </tr>
                    ) : (
                      gdpr.map((item) => (
                        <tr key={item.id} className="dark:hover:bg-navy-800/50">
                          <td className="px-4 py-3 font-medium">Contact ID: {item.contact_id ?? '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{item.purpose ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                item.granted ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                              }`}
                            >
                              {item.granted ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{item.source ?? '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{item.granted_at ? new Date(item.granted_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'exports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="font-semibold text-text-primary text-lg mb-3">Database Data Exports</h3>
                <div className="overflow-x-auto rounded-xl border dark:border-navy-700">
                  <table className="w-full text-sm">
                    <thead className="dark:bg-navy-800/50 bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-text-primary">Type</th>
                        <th className="text-left px-4 py-3 font-medium text-text-primary">Target Entity</th>
                        <th className="text-left px-4 py-3 font-medium text-text-primary">Initiated By</th>
                        <th className="text-left px-4 py-3 font-medium text-text-primary">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-text-primary">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-navy-700">
                      {exportsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                            No export logs generated.
                          </td>
                        </tr>
                      ) : (
                        exportsList.map((exp) => (
                          <tr key={exp.id} className="dark:hover:bg-navy-800/50">
                            <td className="px-4 py-3 font-medium capitalize">{exp.export_type ?? '—'}</td>
                            <td className="px-4 py-3 text-text-muted capitalize">{exp.entity_type ?? '—'}</td>
                            <td className="px-4 py-3 text-text-muted">{exp.initiated_by?.name ?? exp.initiated_by?.email ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600 dark:text-green-400 capitalize">
                                {exp.status ?? 'Completed'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-text-muted">{new Date(exp.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-lg mb-3">Trigger Data Export</h3>
                <form onSubmit={handleTriggerExport} className="space-y-4 p-4 border dark:border-navy-700 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Export Scope</label>
                    <select
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary capitalize text-sm"
                    >
                      <option value="full">Full Backup (JSON)</option>
                      <option value="leads">Leads & Deal History (CSV)</option>
                      <option value="financial">Invoices & Quotations (ZIP)</option>
                      <option value="compliance">Activity Audit Logs (CSV)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Entity Group</label>
                    <select
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary capitalize text-sm"
                    >
                      <option value="contacts">Contacts & Customers</option>
                      <option value="billing">Invoices & Adjustments</option>
                      <option value="audits">Compliance Activity Logs</option>
                      <option value="all">Entire Tenant Database</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={exporting}
                    className="btn-primary w-full py-2 text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {exporting ? 'Generating Export…' : 'Generate Export Log'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Compliance;
export { Compliance };
