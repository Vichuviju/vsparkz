import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Calendar as CalendarIcon,
    Info,
    ArrowRight,
    User,
    CheckCircle2,
    AlertCircle,
    PartyPopper,
    LayoutDashboard,
    ExternalLink,
    Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    useGetMyLeavesQuery,
    useGetMyLeaveBalanceQuery,
    useGetAllLeavesQuery
} from "@/services/hrms/leaves.api.js";
import { useGetMyPermissionsQuery } from "@/services/hrms/permission.api.js";
import { useGetHolidayQuery } from "@/services/hrms/holiday.api.js";
import { useGetDashboardStatsQuery } from "@/services/hrms/attendance.api.js";
import { useGetWeeklyOffQuery } from "@/services/hrms/weeklyoff.js";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api.js";
import { formatDate } from '@/lib/utils';
import { cn } from "@/lib/utils";
import { useHRMSPermissions } from '@/hooks/useHRMSPermissions';

const Card = ({ children, className = "" }) => (
    <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ status, className = "" }) => {
    const styles = {
        'APPROVED': 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50',
        'PENDING': 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50',
        'REJECTED': 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50',
        'YEARLY': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    };
    const s = status?.toUpperCase() || 'PENDING';
    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-transparent", styles[s] || styles['PENDING'], className)}>
            {s}
        </span>
    );
};

export const LeaveDashboard = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state?.user?.user);
    const { checkPermission } = useHRMSPermissions();
    const canManageBalances = checkPermission('/hrms/leave/policy', 'view');
    const canApply = checkPermission('/hrms/leave/apply', 'apply');
    const canViewAll = checkPermission('/hrms/leave/requests', 'view');

    // Queries
    const { data: myData, isLoading: myLeavesLoading } = useGetMyLeavesQuery({ page: 1, limit: 100 });
    const { data: balanceData, isLoading: balanceLoading } = useGetMyLeaveBalanceQuery();
    const { data: allLeavesData } = useGetAllLeavesQuery({ page: 1, limit: 200 }, { skip: !canViewAll });
    const { data: holidayData } = useGetHolidayQuery({ page: 1, limit: 100 });
    const { data: permissionData } = useGetMyPermissionsQuery({ page: 1, limit: 10 });
    const { data: allEmpsData } = useGetAllEmployeesQuery();

    const myEmpRecord = useMemo(() =>
        allEmpsData?.data?.find(e => e.userId === user?.id),
        [allEmpsData, user]);

    const [calendarDate, setCalendarDate] = useState(new Date());

    const { data: weeklyOffData } = useGetWeeklyOffQuery({
        month: calendarDate.getMonth() + 1,
        year: calendarDate.getFullYear(),
        shiftId: myEmpRecord?.shiftId || 'all'
    });

    // Date range for stats (current month)
    const today = new Date();
    const dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data: statsData } = useGetDashboardStatsQuery({ dateFrom, dateTo });

    const leaves = useMemo(() => myData?.data || [], [myData]);
    const teamLeaves = useMemo(() => allLeavesData?.data || [], [allLeavesData]);
    const balances = useMemo(() => balanceData?.data || [], [balanceData]);
    const holidays = useMemo(() => holidayData?.data || [], [holidayData]);
    const permissions = useMemo(() => permissionData?.data || [], [permissionData]);

    const absenteeismRate = statsData?.statistics?.total > 0
        ? Math.round((statsData.statistics.absent / statsData.statistics.total) * 100)
        : 12;
    const pendingCount = useMemo(() => teamLeaves.filter(l => l.status === 'PENDING').length, [teamLeaves]);
    
    const combinedPending = useMemo(() => {
        const l = leaves.map(item => ({ ...item, requestType: 'LEAVE' }));
        const p = permissions.map(item => ({ ...item, requestType: 'PERMISSION' }));
        return [...l, ...p].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [leaves, permissions]);

    const usedPermissionHours = useMemo(() => {
        // ✅ Use accurate backend-calculated value which bypasses pagination limits
        if (permissionData?.monthlyUsed !== undefined) {
            return Number(permissionData.monthlyUsed);
        }

        // Fallback for backward compatibility (manual calculation)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return permissions
            .filter(p => {
                const pDate = new Date(p.date);
                return p.status === 'Approved' &&
                    pDate.getMonth() === currentMonth &&
                    pDate.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + Number(p.duration || 0), 0);
    }, [permissionData, permissions]);

    const monthlyPermissionLimit = useMemo(() => {
        return Number(permissionData?.monthlyLimit ?? 4);
    }, [permissionData]);

    // Dynamic color mapping for leave types - Restoring the "Old Color Design"
    const getColorClass = (code, index) => {
        const c = (code || '').toUpperCase();
        if (c.includes('CL')) return 'from-emerald-500 to-emerald-600';
        if (c.includes('SL')) return 'from-amber-500 to-amber-600';
        if (c.includes('EL')) return 'from-blue-500 to-indigo-600';

        // Fallback rotating vibrant palette so it's never "dark/grey"
        const fallbacks = [
            'from-rose-500 to-rose-600',
            'from-sky-500 to-sky-600',
            'from-violet-500 to-violet-600',
            'from-orange-500 to-orange-600'
        ];
        return fallbacks[index % fallbacks.length];
    };

    return (
        <div className="p-4 md:p-8  bg-slate-50 dark:bg-slate-800 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section - Title removed as it's repetitive with top bar */}
                <div className="flex flex-col md:flex-row justify-end gap-3">
                    {/* {canManageBalances && (
                        <Button
                            onClick={() => navigate('/hrms/admin/leave-balances')}
                            variant="outline"
                            className="border-2 border-blue-600/20 text-blue-600 font-bold py-6 px-8 rounded-xl hover:bg-blue-50 transition-all w-full md:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Manage Balances
                        </Button>
                    )} */}
                    {canApply && (
                        <Button
                            onClick={() => navigate('/hrms/leave/apply')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all w-full md:w-auto"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Apply for New Leave
                        </Button>
                    )}
                </div>

                {/* Balance Cards Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">Personal Leave Balances</h3>
                        <Badge status="Yearly" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {balanceLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
                            ))
                        ) : balances.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <AlertCircle className="mx-auto w-12 h-12 mb-3 opacity-20" />
                                <p className="font-medium">No leave balances allocated. Please contact HR.</p>
                            </div>
                        ) : balances.map((bal, idx) => (
                            <Card key={idx} className={cn(
                                "p-6 flex justify-between items-center text-white border-none shadow-xl relative group transform hover:scale-[1.02] transition-all cursor-default",
                                bal.leaveCode?.includes('CL') ? "bg-gradient-to-br from-emerald-400 to-emerald-600" :
                                    bal.leaveCode?.includes('SL') ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                                        "bg-gradient-to-br from-blue-500 to-indigo-700"
                            )}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CalendarIcon className="w-20 h-20 -rotate-12 translate-x-4 -translate-y-4" />
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center font-black text-2xl backdrop-blur-md shadow-inner">
                                        {bal.leaveCode?.substring(0, 2) || 'LV'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-white/80 text-[10px] uppercase font-black tracking-widest leading-none">
                                            {bal.leaveCode?.includes('CL') ? 'Casual' : bal.leaveCode?.includes('SL') ? 'Sick' : 'Privileged'} Leave
                                        </p>
                                        <p className="text-white font-black text-xl leading-tight">{bal.leaveName}</p>
                                        <div className="flex gap-4 mt-2">
                                            <p className="text-[10px] text-white/90 font-bold uppercase tracking-tighter">Total <span className="text-white text-xs ml-1 font-black">{bal.total}</span></p>
                                            <p className="text-[10px] text-white/90 font-bold uppercase tracking-tighter">Used <span className="text-white text-xs ml-1 font-black">{bal.used}</span></p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <p className="text-5xl font-black tracking-tighter shadow-sm">{bal.remaining}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-white/90 font-black mt-1">Remaining</p>
                                </div>
                            </Card>
                        ))}

                        {/* Permission Summary Card */}
                        <Card className="p-6 flex justify-between items-center text-white border-none shadow-xl relative group transform hover:scale-[1.02] transition-all cursor-default bg-gradient-to-br from-sky-500 to-sky-600">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Clock className="w-20 h-20 rotate-12 translate-x-4 -translate-y-4" />
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="h-14 w-14 bg-sky-500/20 rounded-2xl flex items-center justify-center font-black text-2xl backdrop-blur-md shadow-inner border border-sky-500/30">
                                    <Clock className="w-7 h-7 text-sky-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-white/80 text-[10px] uppercase font-black tracking-widest leading-none">
                                        Permissions / Short Leaves
                                    </p>
                                    <p className="text-white font-black text-xl leading-tight">Monthly Usage</p>
                                    <div className="flex gap-4 mt-2">
                                        <p className="text-[10px] text-white/90 font-bold uppercase tracking-tighter">Limit <span className="text-white text-xs ml-1 font-black">{monthlyPermissionLimit}h</span></p>
                                        <p className="text-[10px] text-white/90 font-bold uppercase tracking-tighter">Used <span className="text-white text-xs ml-1 font-black">{usedPermissionHours}h</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                                <p className="text-5xl font-black tracking-tighter shadow-sm text-sky-400">{Math.max(0, monthlyPermissionLimit - usedPermissionHours)}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/90 font-black mt-1">Hrs Left</p>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Requests Table) */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="flex flex-col h-full border-none shadow-xl bg-white dark:bg-slate-900">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Pending Requests
                                </h3>
                                {/* <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5" onClick={() => navigate('/hrms/leave/my')}>
                                    View All <ArrowRight className="ml-2 w-4 h-4" />
                                </Button> */}
                            </div>
                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Applied Date</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Duration / Date</th>
                                            <th className="px-6 py-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                                        {myLeavesLoading ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Fetching your applications...</td></tr>
                                        ) : combinedPending.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                                        <CalendarIcon className="w-12 h-12" />
                                                        <p className="text-xs font-bold uppercase tracking-widest">No pending requests</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : combinedPending.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">{formatDate(req.createdAt)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            req.requestType === 'PERMISSION' ? "bg-sky-500" :
                                                            (req.leaveType?.includes('CL') ? "bg-emerald-500" :
                                                                 req.leaveType?.includes('SL') ? "bg-orange-500" : "bg-blue-500")
                                                        )} />
                                                        <span className="uppercase font-black text-slate-500 dark:text-slate-400 text-xs tracking-wide">
                                                            {req.requestType === 'PERMISSION' ? 'Permission' : req.leaveType}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-bold text-slate-600 dark:text-slate-400">
                                                    {req.requestType === 'PERMISSION' ? (
                                                        <span className="flex flex-col">
                                                            <span>{formatDate(req.date)}</span>
                                                            <span className="text-[10px] text-slate-400">{req.startTime} - {req.endTime}</span>
                                                        </span>
                                                    ) : (
                                                        `${formatDate(req.fromDate)} — ${formatDate(req.toDate)}`
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Badge status={req.status} className="shadow-sm" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column (Widgets) */}
                    <div className="space-y-8">
                        {/* Calendar Widget */}
                        <Card className="p-1 border-none shadow-xl bg-white dark:bg-slate-900">
                            <div className="px-5 py-4 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Leave Calendar</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-slate-200 border border-slate-300" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Weekend</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-rose-100 border border-rose-200" />
                                        <span className="text-[9px] font-black text-rose-400 uppercase">Holiday</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-primary font-bold text-[10px] uppercase"
                                        onClick={() => navigate('/hrms/attendance/reports')}
                                    >
                                        View All
                                    </Button>
                                </div>
                            </div>
                            <div className="block">
                                <div className="p-2">
                                    <Calendar
                                        mode="single"
                                        selected={calendarDate}
                                        onSelect={setCalendarDate}
                                        className="rounded-xl border-none p-2 w-full rdp-team-calendar"
                                        components={{
                                            DayButton: ({ day, modifiers, className, ...props }) => {
                                                const d = day.date;
                                                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                                                // Find all leave types active on this day
                                                const activeLeaves = Array.from(new Set(
                                                    (canViewAll ? teamLeaves : leaves)
                                                        .filter(l => {
                                                            const start = (l.fromDate || '').split('T')[0];
                                                            const end = (l.toDate || '').split('T')[0];
                                                            const isStatusValid = l.status !== 'REJECTED' && l.status !== 'rejected';
                                                            return dateStr >= start && dateStr <= end && isStatusValid;
                                                        })
                                                        .map(l => (l.leaveType || '').toUpperCase())
                                                ));

                                                const isSunday = d.getDay() === 0;
                                                const isSaturday = d.getDay() === 6;
                                                const isWeeklyOff = (Array.isArray(weeklyOffData?.data) ? weeklyOffData.data : (Array.isArray(weeklyOffData?.result) ? weeklyOffData.result : [])).some(woff => {
                                                    const wDate = new Date(woff.date);
                                                    const wStr = `${wDate.getFullYear()}-${String(wDate.getMonth() + 1).padStart(2, '0')}-${String(wDate.getDate()).padStart(2, '0')}`;
                                                    return wStr === dateStr;
                                                });
                                                const hData = holidayData?.data || (Array.isArray(holidayData) ? holidayData : []);
                                                const isHoliday = hData.some(h => {
                                                    const hDate = new Date(h.date);
                                                    const hStr = `${hDate.getFullYear()}-${String(hDate.getMonth() + 1).padStart(2, '0')}-${String(hDate.getDate()).padStart(2, '0')}`;
                                                    return hStr === dateStr;
                                                });
                                                const isWeekend = isSunday || isSaturday || isWeeklyOff;

                                                return (
                                                    <div className="relative flex flex-col items-center justify-center h-full w-full">
                                                        <button
                                                            {...props}
                                                            className={cn(
                                                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all text-xs font-black relative",
                                                                modifiers.selected ? "!bg-blue-900 !text-white shadow-md" :
                                                                    isHoliday ? "bg-rose-50 text-rose-600 border border-rose-100 shadow-sm" :
                                                                        isWeekend ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400 italic" :
                                                                            "hover:bg-slate-100 dark:hover:bg-slate-800 !text-black dark:!text-white",
                                                                modifiers.today && !modifiers.selected && "bg-slate-100 dark:bg-slate-800 !text-blue-900 border border-blue-900/20",
                                                                className
                                                            )}
                                                        >
                                                            {day.date.getDate()}
                                                        </button>

                                                        {activeLeaves.length > 0 && (
                                                            <div className="flex gap-0.5 mt-0.5 absolute bottom-0.5">
                                                                {activeLeaves.map((type, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={cn(
                                                                            "w-1 h-1 rounded-full",
                                                                            type.includes('CL') ? "bg-emerald-500" :
                                                                                type.includes('SL') ? "bg-orange-500" : "bg-blue-500"
                                                                        )}
                                                                        title={type}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        }}
                                    />
                                    <div className="px-4 py-3 flex flex-wrap gap-4 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 ring-1 ring-slate-100 dark:ring-slate-800 rounded-full py-1 px-2.5 bg-slate-50/50">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black text-slate-500">CL</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 ring-1 ring-slate-100 dark:ring-slate-800 rounded-full py-1 px-2.5 bg-slate-50/50">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            <span className="text-[9px] font-black text-slate-500">SL</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 ring-1 ring-slate-100 dark:ring-slate-800 rounded-full py-1 px-2.5 bg-slate-50/50">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-[9px] font-black text-slate-500">PL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
};
