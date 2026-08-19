import React, { useState } from 'react';
import { Search, Calendar, Calculator, Download, Check, AlertTriangle, User, DollarSign, FileText, Send } from 'lucide-react';
import { useGetAllEmployeesQuery } from '@/services/hrms/employee.api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const IndividualPayrollPage = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [terminationDate, setTerminationDate] = useState('');
  const [settlementData, setSettlementData] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: employeesData } = useGetAllEmployeesQuery();
  const employees = employeesData?.data || [];

  // Filter employees by search query (show all employees for testing)
  const filteredEmployees = employees.filter(emp => {
    const name = (emp.firstName + ' ' + emp.lastName).toLowerCase();
    const code = (emp.empCode || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || code.includes(query);
    return matchesSearch;
  });

  const handleCalculateSettlement = async () => {
    if (!selectedEmployeeId || !terminationDate) {
      return toast.error('Please select employee and termination date');
    }

    setIsCalculating(true);
    try {
      
      const response = await fetch('/hrms/salary-management/settlement/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          terminationDate
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSettlementData(data.data);
        toast.success('Settlement calculated successfully');
      } else {
        toast.error(data.message || 'Failed to calculate settlement');
      }
    } catch (error) {
      
      toast.error('Failed to calculate settlement');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!selectedEmployeeId || !terminationDate) {
      return toast.error('Please select employee and termination date');
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/hrms/salary-management/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          terminationDate
        })
      });

      const data = await response.json();
      if (data.success) {
        setPayrollData(data.data);
        toast.success('Individual payroll processed successfully');
      } else {
        toast.error(data.message || 'Failed to process payroll');
      }
    } catch (error) {
      toast.error('Failed to process payroll');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Individual Payroll Processing</h2>
            <p className="text-sm text-gray-500 mt-0.5">Process single employee payroll for terminations and settlements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Selection */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={16} />
                Select Employee
              </h3>
              
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployeeId(emp.id);
                      setSelectedEmployee(emp);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                      selectedEmployeeId === emp.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                        {(emp.firstName?.[0] || '') + (emp.lastName?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{emp.empCode}</p>
                    </div>
                    {emp.status === 'TERMINATED' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                        Terminated
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payroll Form */}
          <div className="lg:col-span-2 space-y-4">
            {selectedEmployee ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                {/* Employee Info */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-6">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                      {(selectedEmployee.firstName?.[0] || '') + (selectedEmployee.lastName?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedEmployee.empCode} • {selectedEmployee.department?.name || 'N/A'}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Termination Date
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={terminationDate}
                        onChange={e => setTerminationDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCalculateSettlement}
                      disabled={isCalculating}
                      variant="outline"
                      className="flex-1"
                    >
                      {isCalculating ? (
                        <>
                          <Calculator size={16} className="mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator size={16} className="mr-2" />
                          Calculate Settlement
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleProcessPayroll}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Send size={16} className="mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send size={16} className="mr-2" />
                          Process Payroll
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Settlement Breakdown */}
                  {settlementData && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                        <DollarSign size={16} />
                        Final Settlement Breakdown
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700">Notice Period Pay</span>
                          <span className="font-bold text-green-900">₹{(settlementData?.settlementComponents?.noticePay || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700">Gratuity</span>
                          <span className="font-bold text-green-900">₹{(settlementData?.settlementComponents?.gratuity || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700">Leave Encashment</span>
                          <span className="font-bold text-green-900">₹{(settlementData?.settlementComponents?.leaveEncashment || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700">Bonus/Other</span>
                          <span className="font-bold text-green-900">₹{(settlementData?.settlementComponents?.bonus || 0).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-green-300 pt-3 flex justify-between items-center">
                          <span className="font-bold text-green-900">Total Settlement</span>
                          <span className="font-bold text-green-900 text-lg">₹{(settlementData?.totalSettlement || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payroll Breakdown */}
                  {payrollData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <FileText size={16} />
                        Partial Month Payroll
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700">Period</span>
                          <span className="font-bold text-blue-900">{payrollData?.period || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700">Days in Period</span>
                          <span className="font-bold text-blue-900">{payrollData?.daysInPeriod || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700">Payable Days</span>
                          <span className="font-bold text-blue-900">{payrollData?.payableDays || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700">LOP Days</span>
                          <span className="font-bold text-blue-900">{payrollData?.lopDays || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700">Gross Salary</span>
                          <span className="font-bold text-blue-900">₹{(payrollData?.grossSalary || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700">Total Deductions</span>
                          <span className="font-bold text-blue-900">₹{(payrollData?.totalDeductions || 0).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-blue-300 pt-3 flex justify-between items-center">
                          <span className="font-bold text-blue-900">Net Pay</span>
                          <span className="font-bold text-blue-900 text-lg">₹{(payrollData?.netPay || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => toast.success('Payslip downloaded')}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download size={16} className="mr-2" />
                        Download Payslip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <User size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Terminated Employee</h3>
                <p className="text-sm text-gray-500">Choose a terminated employee to process individual payroll</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
