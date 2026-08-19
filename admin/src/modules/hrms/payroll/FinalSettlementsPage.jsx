import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, FileText, User, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useGetPayrollRunsQuery } from '@/services/hrms/salaryManagement.api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const FinalSettlementsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const { data: runsData } = useGetPayrollRunsQuery();
  const runs = runsData?.data || [];

  // Filter for individual payroll runs (settlements)
  const settlementRuns = useMemo(() => {
    return runs.filter(run => run.runType === 'INDIVIDUAL');
  }, [runs]);

  const filteredSettlements = useMemo(() => {
    return settlementRuns.filter(run => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = run.period.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || run.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [settlementRuns, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: settlementRuns.length };
    settlementRuns.forEach(run => {
      const status = run.status.toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [settlementRuns]);

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': 'bg-gray-100 text-gray-600',
      'PENDING_APPROVAL': 'bg-amber-100 text-amber-600',
      'APPROVED': 'bg-green-100 text-green-600',
      'LOCKED': 'bg-blue-100 text-blue-600',
      'REJECTED': 'bg-red-100 text-red-600'
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Final Settlements</h2>
            <p className="text-sm text-gray-500 mt-0.5">View and manage employee termination settlements</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  statusFilter === status ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                )}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by period..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <Button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              variant="outline"
              className="w-full md:w-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Settlements Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">
              Settlement Records ({filteredSettlements.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Period', 'Employee', 'Status', 'Gross Salary', 'Net Pay', 'Actions'].map(h => (
                    <th key={h} className={cn(
                      "px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-left",
                      h === 'Actions' && 'text-right'
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <FileText size={48} />
                        <p className="text-sm font-semibold">No settlement records found</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSettlements.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">{run.period}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                            ES
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Employee #{run.totalEmployeesProcessed}</p>
                          <p className="text-xs text-gray-500">Individual Settlement</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold', getStatusBadge(run.status))}>
                        {run.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{Number(run.totalGrossSalary).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-green-600">
                        ₹{Number(run.totalNetPay).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => setSelectedSettlement(run)}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                        {run.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex items-center gap-2 shrink-0">
            <AlertTriangle size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-gray-800">Settlement Information</span>
          </div>
          <div className="flex flex-col md:flex-row gap-6 flex-1">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                <User size={16} className="text-blue-600" />
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Individual settlements are created for terminated employees and include partial month salary, gratuity, and other dues.
              </p>
            </div>
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                <CheckCircle size={16} className="text-blue-600" />
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Once processed, settlements are marked as LOCKED and cannot be modified. Employees are excluded from future payroll runs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Sidebar */}
      {selectedSettlement && (
        <div
          className="fixed inset-0 flex items-start justify-end z-[9999] bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedSettlement(null); }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 w-full max-w-[400px] h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Settlement Details</h2>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 px-6 py-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-blue-900 mb-4">Settlement Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Period</span>
                    <span className="font-bold text-blue-900">{selectedSettlement.period}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Status</span>
                    <span className={cn('font-bold', getStatusBadge(selectedSettlement.status))}>
                      {selectedSettlement.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Gross Salary</span>
                    <span className="font-bold text-blue-900">₹{Number(selectedSettlement.totalGrossSalary).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Deductions</span>
                    <span className="font-bold text-blue-900">₹{Number(selectedSettlement.totalDeductions).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-3 flex justify-between">
                    <span className="font-bold text-blue-900">Net Pay</span>
                    <span className="font-bold text-blue-900 text-lg">₹{Number(selectedSettlement.totalNetPay).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/30">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Download size={16} className="mr-2" />
                Download Payslip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
