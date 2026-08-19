import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  UserMinus, 
  Clock, 
  Search, 
  Filter,
  Calendar
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, title, count, colorClass }) => (
  <div className={`flex items-center p-6 rounded-lg text-white shadow-sm ${colorClass}`}>
    <div className="p-3 bg-white/20 rounded-full mr-4">
      <Icon size={28} />
    </div>
    <div>
      <h3 className="text-3xl font-bold">{count}</h3>
      <p className="text-sm opacity-90">{title}</p>
    </div>
  </div>
);

export const AttendanceAll = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/attendance');
        setAttendanceData(res.data?.data || []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-4 md:p-8 font-sans text-gray-800">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Users} 
          title="Total Employees" 
          count="132" 
          colorClass="bg-blue-500" 
        />
        <StatCard 
          icon={CheckCircle} 
          title="On time" 
          count="47" 
          colorClass="bg-emerald-500" 
        />
        <StatCard 
          icon={UserMinus} 
          title="Absent" 
          count="51" 
          colorClass="bg-red-500" 
        />
        <StatCard 
          icon={Clock} 
          title="Late" 
          count="31" 
          colorClass="bg-orange-400" 
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-t-lg shadow-sm border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold">History</h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From:</span>
            <div className="relative">
              <input 
                type="date" 
                defaultValue="2026-02-16"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <div className="relative">
              <input 
                type="date" 
                defaultValue="2026-02-16"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="relative min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search by Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Limit:</span>
            <select className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
              <option>50</option>
              <option>100</option>
            </select>
          </div>

          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2">
            <Filter size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-sm rounded-b-lg overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-600 text-sm font-semibold border-b border-gray-100">
              <th className="px-6 py-4">Profile</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Emp Code</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Department Manager</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">First In</th>
              <th className="px-6 py-4">Last Out</th>
              <th className="px-6 py-4">Total Hours</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Timing Status</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="12" className="text-center py-4">Loading attendance...</td></tr>
            ) : attendanceData.length === 0 ? (
              <tr><td colSpan="12" className="text-center py-4">No records found.</td></tr>
            ) : attendanceData.map((emp, index) => (
              <tr key={emp.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50 transition-colors`}>
                <td className="px-6 py-4">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.employee_name)}`} 
                    alt={emp.employee_name} 
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  />
                </td>
                <td className="px-6 py-4">
                  <a href="#" className="text-emerald-600 font-semibold hover:underline decoration-2 underline-offset-4">
                    {emp.employee_name}
                  </a>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">EMP-{emp.user_id}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">General</td>
                <td className="px-6 py-4 text-gray-500 text-sm">-</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{emp.date}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{emp.check_in || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{emp.check_out || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{emp.hours_worked || 0}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">HQ</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{emp.status}</td>
                <td className="px-6 py-4 text-gray-500 text-sm capitalize">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    emp.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                    emp.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}