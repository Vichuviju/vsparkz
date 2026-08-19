import React, { useState } from 'react';
import { 
  History, Search, Filter, 
  Calendar, User, Box, 
  ChevronLeft, ChevronRight,
  FileText, Activity, Shield
} from 'lucide-react';
import { useGetAuditLogsQuery } from '@/services/hrms/audit.api';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    moduleId: '',
    userId: '',
    search: ''
  });

  const { data, isLoading } = useGetAuditLogsQuery({
    page,
    limit: 50,
    ...filters
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          {/* <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Shield size={24} />
            </div>
            Audit Logs
          </h1> */}
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">
            System-wide activity trail & governance
          </p>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <select 
                    value={filters.moduleId}
                    onChange={(e) => {
                        setFilters(prev => ({ ...prev, moduleId: e.target.value }));
                        setPage(1);
                    }}
                    className="pl-4 pr-10 py-2 bg-transparent text-sm font-bold text-slate-600 focus:outline-none appearance-none cursor-pointer"
                >
                    <option value="">All Modules</option>
                    <option value="10">HRMS</option>
                    <option value="11">Attendance</option>
                    <option value="12">Payroll</option>
                    <option value="13">Leaves</option>
                    <option value="14">Expenses</option>
                    <option value="15">Workflows</option>
                </select>
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <Filter size={18} />
                </div>
            </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-4">
                      <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-tighter">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100">
                          {log.user?.[0] || 'S'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{log.user || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-wider">
                        {log.module || 'General'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                          <Activity size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{log.activityType || 'Action Performed'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-xs text-slate-500 font-medium">
                          {typeof log.metaData === 'string' ? log.metaData : JSON.stringify(log.metaData)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <History size={64} className="mb-4 text-slate-300" />
                      <p className="text-lg font-black text-slate-900">No logs found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing {logs.length} of {pagination.total} records
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => (
                  <button 
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      page === i + 1 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
