import React, { useState } from 'react';
import { 
  FileText, Download, Filter, Calendar, Users, Clock, CreditCard, ChevronDown 
} from 'lucide-react';
import toast from 'react-hot-toast';

const REPORTS = [
  { id: 'attendance', name: 'Monthly Attendance Summary', icon: Clock, desc: 'Detailed view of check-ins, check-outs, and total hours.' },
  { id: 'leaves', name: 'Leave Balance & Usage', icon: Calendar, desc: 'Track taken leaves, pending requests, and balances.' },
  { id: 'payroll', name: 'Payroll Register', icon: CreditCard, desc: 'Comprehensive breakdown of earnings, deductions, and net pay.' },
  { id: 'employees', name: 'Employee Master Data', icon: Users, desc: 'Complete directory with department and contact details.' }
];

export const HrmsStandardReports = () => {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState('this_month');
  const [generating, setGenerating] = useState(false);

  const handleExport = (format) => {
    setGenerating(true);
    toast.loading(`Generating ${format} report...`, { id: 'export' });
    
    // Simulate API call for report generation
    setTimeout(() => {
      setGenerating(false);
      toast.success(`Report downloaded as ${format}`, { id: 'export' });
    }, 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Standard Reports</h1>
          <p className="text-gray-500">Generate and export HRMS compliance reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Selection */}
        <div className="lg:col-span-1 space-y-2">
          {REPORTS.map(r => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedReport === r.id 
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <Icon size={18} className={selectedReport === r.id ? 'text-blue-600' : 'text-gray-500'} />
                  <span className={`font-semibold ${selectedReport === r.id ? 'text-blue-900' : 'text-gray-700'}`}>
                    {r.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{r.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Report Configuration */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px] flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
              <FileText size={24} className="text-blue-600"/>
              Configure Report
            </h2>

            <div className="space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="q1">Q1 (Jan - Mar)</option>
                    <option value="ytd">Year to Date</option>
                    <option value="custom">Custom Range...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Filter</label>
                  <select className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="all">All Departments</option>
                    <option value="it">IT & Engineering</option>
                    <option value="hr">Human Resources</option>
                    <option value="sales">Sales & Marketing</option>
                  </select>
                </div>
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                    <input type="date" className="w-full rounded border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                    <input type="date" className="w-full rounded border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-auto">
              <button 
                onClick={() => handleExport('CSV')}
                disabled={generating}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={18} /> Export CSV
              </button>
              <button 
                onClick={() => handleExport('PDF')}
                disabled={generating}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-blue-200"
              >
                <FileText size={18} /> Generate PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrmsStandardReports;
