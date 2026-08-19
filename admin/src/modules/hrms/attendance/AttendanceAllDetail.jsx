import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  UserMinus, 
  Clock, 
  Filter,
  ChevronLeft,
  Bell,
  CalendarIcon,
  Megaphone
} from 'lucide-react';
import { HolidayView } from './Holiday';
import { useNavigate } from 'react-router-dom';
import { useGetAttendanceQuery, useGetAllEmployeeAttendanceQuery } from "@/services/hrms/attendance.api"



// --- Shared Data & Constants ---
const MOCK_DATA = [
 {
    id: 1,
    avatar: "https://i.pravatar.cc/150?u=aala",
    name: "Aala Talji",
    empCode: "GCL/25/0122",
    department: "COMPLIANCE",
    manager: "Jameel Karikkalakath",
    date: "2026-02-16",
    firstIn: "N/A",
    lastOut: "N/A",
    totalHours: "0",
    timingStatus: "Absent",
    location: "chennai",
    status: "Absent"
  },
  {
    id: 2,
    avatar: "https://i.pravatar.cc/150?u=aayush",
    name: "Aayush Kapoor",
    empCode: "LOI/26/0146",
    department: "IT",
    manager: "Ameer Basha",
    date: "2026-02-16",
    firstIn: "16/02/2026, 10:25:40",
    lastOut: "16/02/2026, 18:30:15",
    totalHours: "9",
    timingStatus: "Late Login",
    location: "Goa",
    status: "Late"
  },
  {
    id: 3,
    avatar: "https://i.pravatar.cc/150?u=abdalla",
    name: "Abdalla Mohamed",
    empCode: "GIS/26/0148",
    department: "Sales",
    manager: "Richa Agrawal",
    date: "2026-02-16",
    firstIn: "16/02/2026, 09:56:28",
    lastOut: "16/02/2026, 17:45:12",
    totalHours: "9",
    timingStatus: "on Time",
    location: "Chengalpattu",
    status: "On time"
  }
];

// --- Sub-Components ---
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

const CircularProgress = ({ percentage, color, size = 120 }) => {
  const radius = (size - 20) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f3f4f6" strokeWidth="10" fill="transparent" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" fill="transparent" className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-2xl font-bold">{percentage}%</span>
    </div>
  );
};

// --- Component 1: DashboardView (Main List) ---
const DashboardView = ({ onSelectEmployee }) => {
    const navigate = useNavigate();
    const today = new Date().toISOString().split("T")[0]
    const [dateFrom, setDateFrom] = useState(today)
    const [dateTo, setDateTo] = useState(today)

    // const { data, isLoading } = useGetAttendanceQuery()

    const { data, isLoading } = useGetAllEmployeeAttendanceQuery({
        dateFrom,
        dateTo,
        page: 1,
        limit: 50,
    })


    // backend response
    const attendanceList = data?.result?.data || []
    const stats = data?.result?.statistics || {}
    const pagination = data?.result?.pagination || {}


    // Dynamic Stats
  const totalEmployees = attendanceList.length
  const onTime = attendanceList.filter(a => a.status === "On time").length
  const absent = attendanceList.filter(a => a.status === "Absent").length
  const late = attendanceList.filter(a => a.status === "Late").length

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-end items-center">
        <button 
          onClick={()=>{navigate('/hrms/holiday')}}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
        >
          <CalendarIcon size={18} className="text-emerald-500" />
          Holiday Management
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
       <StatCard icon={Users} title="Total Employees" count={stats.totalemployee || 0} colorClass="bg-blue-500" />
       <StatCard icon={CheckCircle} title="On time" count={stats.ontime || 0} colorClass="bg-emerald-500" />
       <StatCard icon={UserMinus} title="Absent" count={stats.absent || 0} colorClass="bg-red-500" />
       <StatCard icon={Clock} title="Late" count={stats.late || 0} colorClass="bg-orange-400" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold">History</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">From:</span>
              <input
  type="date"
  value={dateFrom}
  onChange={(e) => setDateFrom(e.target.value)}
  className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
/>
<span className="text-sm font-medium">To:</span>
<input
  type="date"
  value={dateTo}
  onChange={(e) => setDateTo(e.target.value)}
  className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
/>

            </div>
            <input type="text" placeholder="Search by Name" className="border rounded px-3 py-1.5 text-sm w-48 outline-none focus:ring-2 focus:ring-emerald-500" />
            {/* <button className="bg-emerald-500 text-white px-6 py-1.5 rounded text-sm font-medium flex items-center gap-2">
              <Filter size={14} /> Filters
            </button> */}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm font-semibold border-b bg-gray-50/50">
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Emp Code</th>
                <th className="px-6 py-4">Department</th>
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
             {isLoading && (
                <tr>
                <td colSpan="11" className="text-center py-6 text-gray-400">
                    Loading attendance...
                </td>
                </tr>
             )}
              {!isLoading && MOCK_DATA.map((emp) => ( //attendanceList need to map
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <img src={emp.avatar} alt="" className="w-10 h-10 rounded-full border" />
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => onSelectEmployee(emp)} className="text-emerald-600 font-semibold hover:underline">
                      {emp.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.empCode}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.department}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.date}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.firstIn}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.lastOut}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.totalHours}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.location}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.timingStatus}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Component 2: DetailsView (Individual View) ---
const DetailsView = ({ employee, onBack }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-emerald-600 font-bold text-xl hover:opacity-70 transition-opacity">
          <ChevronLeft className="mr-1" size={24} /> Back
        </button>
      </div>

      <h3 className="text-lg font-bold">Attendance Details - {employee.name}</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="relative mb-4">
            <img src={employee.avatar} className="w-24 h-24 rounded-full border-4 border-gray-50" alt="" />
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <h3 className="text-xl font-bold text-center">{employee.name}</h3>
          <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest">User</p>
          <div className="w-full pt-4 border-t">
            <p className="text-sm font-bold text-gray-700">{employee.department}</p>
            <p className="text-xs text-gray-400">Department</p>
          </div>
        </div>

        {/* Analytics Ring */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4">Attendance</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex flex-col"><span className="text-emerald-500 font-bold">29%</span><span className="text-[10px] text-gray-400 uppercase font-semibold">On Time</span></div>
              <div className="flex flex-col"><span className="text-orange-400 font-bold">14%</span><span className="text-[10px] text-gray-400 uppercase font-semibold">Late</span></div>
              <div className="flex flex-col"><span className="text-red-500 font-bold">5%</span><span className="text-[10px] text-gray-400 uppercase font-semibold">Early Logout</span></div>
            </div>
            <div className="relative w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center border-[10px] border-gray-100">
               <div className="absolute inset-[-10px] rounded-full border-[10px] border-emerald-500" style={{clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)'}}></div>
            </div>
          </div>
        </div>

        {/* Hours Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Hours</h3>
            <span className="text-[10px] text-gray-400 border px-2 py-0.5 rounded">Monthly</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div><p className="text-2xl font-bold">168</p><p className="text-[10px] text-gray-400 uppercase font-bold">Targeted</p></div>
              <div><p className="text-2xl font-bold">77</p><p className="text-[10px] text-gray-400 uppercase font-bold">Achieved</p></div>
            </div>
            <CircularProgress percentage={46} color="#10b981" />
          </div>
        </div>
      </div>

      {/* History Detail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <h2 className="text-md font-bold">History</h2>
          <div className="flex gap-4">
             <div className="text-[10px] flex items-center gap-2 font-bold uppercase text-gray-400">From: <span className="text-gray-800 border p-1 rounded font-normal">16-01-2026</span></div>
             <div className="text-[10px] flex items-center gap-2 font-bold uppercase text-gray-400">To: <span className="text-gray-800 border p-1 rounded font-normal">16-02-2026</span></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">First In</th>
                <th className="px-6 py-4">Last Out</th>
                <th className="px-6 py-4">Total Hours</th>
                <th className="px-6 py-4">Timing Status</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b last:border-0">
                <td className="px-6 py-6 text-gray-600">{employee.date}</td>
                <td className="px-6 py-6 text-gray-600">{employee.firstIn}</td>
                <td className="px-6 py-6 text-gray-600">{employee.lastOut}</td>
                <td className="px-6 py-6 text-emerald-600 font-bold">{employee.totalHours || '0h 0m'}</td>
                <td className="px-6 py-6">
                  <span className="bg-orange-50 text-orange-400 px-3 py-1 rounded text-xs font-bold border border-orange-100">{employee.timingStatus}</span>
                </td>
                <td className="px-6 py-6">
                  <span className="bg-orange-50 text-orange-400 px-3 py-1 rounded text-xs font-bold border border-orange-100">{employee.status}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Main App Controller ---
export const AttendanceAll = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        {selectedEmployee ? (
          <DetailsView 
            employee={selectedEmployee} 
            onBack={() => setSelectedEmployee(null)} 
          />
        ) : (
          <DashboardView 
            onSelectEmployee={setSelectedEmployee} 
          />
        )}
      </div>
    </div>
  );
}