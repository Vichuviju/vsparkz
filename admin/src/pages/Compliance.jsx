import { useState } from 'react';
import { Link } from 'react-router-dom';

function Compliance() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Audit & Compliance</h1>
      <p className="text-text-muted mb-4">Audit logs, NDAs, consent records, and data retention.</p>
      <div className="flex gap-2 mb-4 border-b dark:border-navy-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded text-sm font-medium ${activeTab === 'overview' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'}`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 rounded text-sm font-medium ${activeTab === 'audit' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'}`}
        >
          Audit log
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exports')}
          className={`px-3 py-2 rounded text-sm font-medium ${activeTab === 'exports' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'}`}
        >
          Data exports
        </button>
      </div>
      <div className="glass-card rounded-2xl p-6">
        {activeTab === 'overview' && (
          <p className="text-text-muted text-sm">
            Compliance features include activity audit logs, NDA documents, GDPR consent records, and data retention policies.
            Configure retention and export logs from System Settings. Audit logs are recorded automatically for key actions.
          </p>
        )}
        {activeTab === 'audit' && (
          <div>
            <p className="text-text-muted text-sm mb-4">
              Recent activity and audit log entries. When the audit API is configured, entries will appear here.
            </p>
            <div className="border dark:border-navy-600 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="dark:bg-navy-800/50 bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-navy-600">
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-text-muted">No audit log entries yet. Audit logging can be enabled in System Settings.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'exports' && (
          <div>
            <p className="text-text-muted text-sm mb-4">
              Request a data export or view past export history. Configure scheduled exports in System Settings.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/system-settings" className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
                Open System Settings
              </Link>
              <span className="text-text-muted text-sm self-center">Configure data export and retention in the System Config page.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Compliance;
export { Compliance };
