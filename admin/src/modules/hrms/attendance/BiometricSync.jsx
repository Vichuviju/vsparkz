import React, { useState, useEffect } from "react";
import { 
  Wifi, WifiOff, Clock, Settings, Activity, AlertCircle, 
  CheckCircle, RefreshCw, Server, Database, History, 
  Monitor, Cpu, Calendar, TrendingUp, Download, Upload
} from "lucide-react";
import { useBiometricSyncMutation, useGetDeviceStatusQuery, useGetActiveDeviceQuery, useGetSyncHistoryQuery, useUpdateDeviceConfigMutation, useUpdateSyncSettingsMutation, useTestDeviceConnectionMutation } from "@/services/hrms/attendance.api";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";

const BiometricSync = () => {
  const [deviceConfig, setDeviceConfig] = useState({
    ip: "192.168.1.100",
    port: "8080",
    deviceType: "TCP/IP",
    model: "BioMini",
    firmware: "2.1.0"
  });

  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: "5", // minutes
    retryAttempts: 3,
    timeout: 30 // seconds
  });

  const [syncHardware, { isLoading: isSyncing }] = useBiometricSyncMutation();
  const { data: deviceStatusData, refetch: refetchDeviceStatus } = useGetDeviceStatusQuery();
  const { data: activeDevice } = useGetActiveDeviceQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { data: syncHistoryData, refetch: refetchSyncHistory } = useGetSyncHistoryQuery({ 
    deviceId: activeDevice?.data?.id, 
    limit: pageSize, 
    page: currentPage 
  });
  const [updateDeviceConfig] = useUpdateDeviceConfigMutation();
  const [updateSyncSettings] = useUpdateSyncSettingsMutation();
  const [testConnection] = useTestDeviceConnectionMutation();

  const deviceStatus = deviceStatusData?.data || {
    connected: false,
    lastSeen: "Never",
    uptime: "0%",
    health: "unknown",
    responseTime: "N/A"
  };

  const syncHistory = syncHistoryData?.data || [];
  const pagination = syncHistoryData?.pagination || {};

  // Reset to page 1 when device changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeDevice?.data?.id]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Initialize device config from active device
  useEffect(() => {
    if (activeDevice?.data) {
      const device = activeDevice.data;
      setDeviceConfig({
        ip: device.ipAddress || "192.168.1.100",
        port: device.port || "8080",
        deviceType: device.deviceType || "TCP/IP",
        model: device.deviceModel || "BioMini",
        firmware: device.firmwareVersion || "2.1.0"
      });

      setSyncSettings({
        autoSync: device.autoSync ?? true,
        syncInterval: device.syncInterval ?? 5,
        retryAttempts: device.retryAttempts ?? 3,
        timeout: device.connectionTimeout ?? 30
      });
    }
  }, [activeDevice]);

  const handleSync = async () => {
    try {
      toast.loading("Syncing biometric hardware...", { id: 'sync' });
      // In production, this data would come directly from the SDK, we are passing simulated reads to the real backend
      const punches = [
        { employee_id: 1, timestamp: new Date().toISOString(), type: "in" },
        { employee_id: 2, timestamp: new Date().toISOString(), type: "in" },
        { employee_id: 3, timestamp: new Date().toISOString(), type: "out" }
      ];
      
      // Use the generic axios api instance for the new Laravel backend
      const { api } = await import('../../../lib/api');
      await api.post('/admin/attendance/sync', { punches });
      
      // Refresh device status and sync history after sync
      refetchDeviceStatus();
      refetchSyncHistory();
      
      toast.success("Biometric synchronization successful!", { id: 'sync' });
    } catch (error) {
      toast.error(`Failed to sync biometric data: ${error.message}`, { id: 'sync' });
    }
  };

  const handleTestConnection = async () => {
    if (!activeDevice?.data?.id) {
      toast.error("No active device found");
      return;
    }

    try {
      toast.loading("Testing connection...", { id: 'test-connection' });
      
      const result = await testConnection(activeDevice.data.id).unwrap();
      
      if (result.data?.connected) {
        toast.success("Connection test successful!", { id: 'test-connection' });
      } else {
        toast.error("Connection test failed - device not responding", { id: 'test-connection' });
      }
      
      // Refresh device status after test
      refetchDeviceStatus();
    } catch (error) {
      toast.error(`Connection test failed: ${error.message}`, { id: 'test-connection' });
    }
  };

  const handleSaveDeviceConfig = async () => {
    if (!activeDevice?.data?.id) {
      toast.error("No active device found");
      return;
    }

    try {
      toast.loading("Saving device configuration...", { id: 'save-config' });
      
      const configData = {
        ipAddress: deviceConfig.ip,
        port: deviceConfig.port,
        deviceType: deviceConfig.deviceType,
        deviceModel: deviceConfig.model,
        firmwareVersion: deviceConfig.firmware
      };
      
      await updateDeviceConfig({ id: activeDevice.data.id, ...configData }).unwrap();
      
      toast.success("Device configuration saved successfully!", { id: 'save-config' });
      refetchDeviceStatus();
    } catch (error) {
      toast.error(`Failed to save device configuration: ${error.message}`, { id: 'save-config' });
    }
  };

  const handleSaveSyncSettings = async () => {
    if (!activeDevice?.data?.id) {
      toast.error("No active device found");
      return;
    }

    try {
      toast.loading("Saving sync settings...", { id: 'save-settings' });
      
      const settingsData = {
        autoSync: syncSettings.autoSync,
        syncInterval: parseInt(syncSettings.syncInterval),
        retryAttempts: parseInt(syncSettings.retryAttempts),
        connectionTimeout: parseInt(syncSettings.timeout)
      };
      
      await updateSyncSettings({ id: activeDevice.data.id, ...settingsData }).unwrap();
      
      toast.success("Sync settings saved successfully!", { id: 'save-settings' });
      refetchDeviceStatus();
    } catch (error) {
      toast.error(`Failed to save sync settings: ${error.message}`, { id: 'save-settings' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} />;
      case 'error': return <AlertCircle size={16} />;
      case 'warning': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="biometric-sync-container  bg-slate-50 dark:bg-slate-800 p-6 space-y-6 !important" style={{ minHeight: '100vh', backgroundColor: 'rgb(249 250 251)', padding: '1.5rem' }}>
        {/* Header */}


        {/* Device Status Cards */}
        <div className="biometric-status-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 !important" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div className="biometric-status-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 !important" style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid rgb(229 231 235)' }}>
            <div className="biometric-status-header flex items-center justify-between mb-2 !important" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="biometric-status-label text-sm text-gray-500 !important" style={{ fontSize: '0.875rem', color: 'rgb(107 114 128)' }}>Connection Status</span>
              {deviceStatus.connected ? <Wifi size={20} className="text-green-500 !important" style={{ color: 'rgb(34 197 94)' }} /> : <WifiOff size={20} className="text-red-500 !important" style={{ color: 'rgb(239 68 68)' }} />}
            </div>
            <div className={`biometric-status-value text-lg font-semibold !important ${deviceStatus.connected ? 'text-green-600' : 'text-red-600'}`} style={{ fontSize: '1.125rem', fontWeight: '600', color: deviceStatus.connected ? 'rgb(34 197 94)' : 'rgb(239 68 68)' }}>
              {deviceStatus.connected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="biometric-status-footer text-xs text-gray-400 mt-1 !important" style={{ fontSize: '0.75rem', color: 'rgb(156 163 175)', marginTop: '0.25rem' }}>Last seen: {deviceStatus.lastSeen}</div>
          </div>

          <div className="biometric-status-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 !important" style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid rgb(229 231 235)' }}>
            <div className="biometric-status-header flex items-center justify-between mb-2 !important" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="biometric-status-label text-sm text-gray-500 !important" style={{ fontSize: '0.875rem', color: 'rgb(107 114 128)' }}>Response Time</span>
              <Activity size={20} className="text-blue-500 !important" style={{ color: 'rgb(59 130 246)' }} />
            </div>
            <div className="biometric-status-value text-lg font-semibold text-blue-600 !important" style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgb(59 130 246)' }}>{deviceStatus.responseTime}</div>
            <div className="biometric-status-footer text-xs text-gray-400 mt-1 !important" style={{ fontSize: '0.75rem', color: 'rgb(156 163 175)', marginTop: '0.25rem' }}>Average latency</div>
          </div>

          <div className="biometric-status-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 !important" style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid rgb(229 231 235)' }}>
            <div className="biometric-status-header flex items-center justify-between mb-2 !important" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="biometric-status-label text-sm text-gray-500 !important" style={{ fontSize: '0.875rem', color: 'rgb(107 114 128)' }}>Uptime</span>
              <TrendingUp size={20} className="text-green-500 !important" style={{ color: 'rgb(34 197 94)' }} />
            </div>
            <div className="biometric-status-value text-lg font-semibold text-green-600 !important" style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgb(34 197 94)' }}>{deviceStatus.uptime}</div>
            <div className="biometric-status-footer text-xs text-gray-400 mt-1 !important" style={{ fontSize: '0.75rem', color: 'rgb(156 163 175)', marginTop: '0.25rem' }}>Last 30 days</div>
          </div>

          <div className="biometric-status-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 !important" style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid rgb(229 231 235)' }}>
            <div className="biometric-status-header flex items-center justify-between mb-2 !important" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="biometric-status-label text-sm text-gray-500 !important" style={{ fontSize: '0.875rem', color: 'rgb(107 114 128)' }}>Device Health</span>
              <Monitor size={20} className="text-purple-500 !important" style={{ color: 'rgb(168 85 247)' }} />
            </div>
            <div className="biometric-status-value text-lg font-semibold text-purple-600 !important" style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgb(168 85 247)', textTransform: 'capitalize' }}>{deviceStatus.health}</div>
            <div className="biometric-status-footer text-xs text-gray-400 mt-1 !important" style={{ fontSize: '0.75rem', color: 'rgb(156 163 175)', marginTop: '0.25rem' }}>System status</div>
          </div>
        </div>

        <div className="biometric-config-grid grid grid-cols-1 lg:grid-cols-3 gap-6 !important" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {/* Device Configuration */}
          <div className="biometric-config-panel bg-white rounded-xl p-6 shadow-sm border border-gray-200 !important" style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid rgb(229 231 235)' }}>
            <div className="biometric-panel-header flex items-center gap-2 mb-4 !important" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Settings size={20} className="text-gray-600 !important" style={{ color: 'rgb(75 85 99)' }} />
              <h2 className="biometric-panel-title text-lg font-semibold text-gray-900 !important" style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgb(17 24 39)' }}>Device Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device IP Address</label>
                <input
                  type="text"
                  value={deviceConfig.ip}
                  onChange={(e) => setDeviceConfig(prev => ({ ...prev, ip: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input
                  type="text"
                  value={deviceConfig.port}
                  onChange={(e) => setDeviceConfig(prev => ({ ...prev, port: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
                <select
                  value={deviceConfig.deviceType}
                  onChange={(e) => setDeviceConfig(prev => ({ ...prev, deviceType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TCP/IP">TCP/IP</option>
                  <option value="USB">USB</option>
                  <option value="Serial">Serial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Model</label>
                <input
                  type="text"
                  value={deviceConfig.model}
                  onChange={(e) => setDeviceConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firmware Version</label>
                <input
                  type="text"
                  value={deviceConfig.firmware}
                  onChange={(e) => setDeviceConfig(prev => ({ ...prev, firmware: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={handleSaveDeviceConfig}>
            Save Configuration
          </button>
            </div>
          </div>

          {/* Sync Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sync Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Auto Sync</label>
                <button
                  onClick={() => setSyncSettings(prev => ({ ...prev, autoSync: !prev.autoSync }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    syncSettings.autoSync ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      syncSettings.autoSync ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sync Interval (minutes)</label>
                <input
                  type="number"
                  value={syncSettings.syncInterval}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, syncInterval: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!syncSettings.autoSync}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retry Attempts</label>
                <input
                  type="number"
                  value={syncSettings.retryAttempts}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, retryAttempts: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (seconds)</label>
                <input
                  type="number"
                  value={syncSettings.timeout}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, timeout: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Calendar size={16} />
                  <span>Next scheduled sync:</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {syncSettings.autoSync ? 'In 5 minutes' : 'Auto-sync disabled'}
                </div>
              </div>
              
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={handleSaveSyncSettings}>
            Save Settings
          </button>
            </div>
          </div>

          {/* Sync History */}
          <div className="biometric-sync-history bg-white rounded-xl p-6 shadow-sm border border-gray-200 !important" style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid rgb(229 231 235)' }}>
            <div className="biometric-history-header flex items-center justify-between mb-4 !important" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="flex items-center gap-2 !important" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} className="text-gray-600 !important" style={{ color: 'rgb(75 85 99)' }} />
                <h2 className="biometric-history-title text-lg font-semibold text-gray-900 !important" style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgb(17 24 39)' }}>Sync History</h2>
              </div>
              <div className="biometric-history-info text-sm text-gray-500 !important" style={{ fontSize: '0.875rem', color: 'rgb(107 114 128)' }}>
                {pagination.total ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} entries` : 'No entries'}
              </div>
            </div>
            
            <div className="biometric-history-list space-y-3 max-h-96 overflow-y-auto !important" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '24rem', overflowY: 'auto' }}>
              {syncHistory.map((entry) => (
                <div key={entry.id} className="biometric-history-item border border-gray-200 rounded-lg p-3 !important" style={{ border: '1px solid rgb(229 231 235)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <div className="biometric-item-header flex items-center justify-between mb-2 !important" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div className="flex items-center gap-2 !important" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className={`p-1 rounded-full ${getStatusColor(entry.status)} !important`} style={{ padding: '0.25rem', borderRadius: '9999px' }}>
                        {getStatusIcon(entry.status)}
                      </div>
                      <span className="text-sm font-medium capitalize !important" style={{ fontSize: '0.875rem', fontWeight: '500', textTransform: 'capitalize' }}>{entry.status}</span>
                    </div>
                    <span className="text-xs text-gray-500 !important" style={{ fontSize: '0.75rem', color: 'rgb(107 114 128)' }}>{entry.timestamp}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1 !important" style={{ fontSize: '0.875rem', color: 'rgb(75 85 99)', marginBottom: '0.25rem' }}>{entry.message}</div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 !important" style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'rgb(107 114 128)' }}>
                    <div className="flex items-center gap-1 !important" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Database size={12} />
                      <span>{entry.recordsProcessed} records</span>
                    </div>
                    <div className="flex items-center gap-1 !important" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      <span>{entry.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {syncHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500 !important" style={{ textAlign: 'center', padding: '2rem 0', color: 'rgb(107 114 128)' }}>
                  <div className="flex flex-col items-center gap-2 !important" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={48} className="text-gray-300 !important" style={{ color: 'rgb(209 213 219)' }} />
                    <span>No sync history available</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="biometric-pagination flex items-center justify-between mt-4 pt-4 border-t border-gray-200 !important" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgb(229 231 235)' }}>
                <div className="flex items-center gap-2 !important" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="biometric-page-prev px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed !important"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.875rem', 
                      border: '1px solid rgb(209 213 219)', 
                      borderRadius: '0.375rem',
                      cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                      opacity: pagination.hasPrev ? 1 : 0.5
                    }}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 !important" style={{ fontSize: '0.875rem', color: 'rgb(75 85 99)' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="biometric-page-next px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed !important"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.875rem', 
                      border: '1px solid rgb(209 213 219)', 
                      borderRadius: '0.375rem',
                      cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                      opacity: pagination.hasNext ? 1 : 0.5
                    }}
                  >
                    Next
                  </button>
                </div>
                
                <div className="text-sm text-gray-500 !important" style={{ fontSize: '0.875rem', color: 'rgb(107 114 128)' }}>
                  {pageSize} entries per page
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BiometricSync;
