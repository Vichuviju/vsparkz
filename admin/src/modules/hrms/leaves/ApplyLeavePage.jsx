import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from "react-hook-form";
import { useSelector } from "react-redux";
import { Calendar as CalendarIcon, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-inputs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { 
    useApplyLeaveMutation,
    useGetMyLeavesQuery,
    useGetAllLeavesQuery
} from "@/services/hrms/leaves.api.js";
import { useGetLeaveConfigsQuery } from "@/services/hrms/leaveConfig.api.js";
import { useGetWeeklyOffQuery } from "@/services/hrms/weeklyoff.js";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api.js";
import { useGetHolidayQuery } from "@/services/hrms/holiday.api.js";
import { cn } from "@/lib/utils";

const Card = ({ children, className = "" }) => (
  <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

export const ApplyLeavePage = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state?.user?.user);
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR'].includes(user?.role?.toUpperCase());
    
    const [applyLeave, { isLoading: isSubmitting }] = useApplyLeaveMutation();
    const { data: configData, isLoading: isConfigsLoading } = useGetLeaveConfigsQuery();
    
    // Queries for calendar dots
    const { data: myLeavesData } = useGetMyLeavesQuery({ page: 1, limit: 100 });
    const { data: allLeavesData } = useGetAllLeavesQuery({ page: 1, limit: 100 }, { skip: !isAdmin });
    const { data: allEmpsData } = useGetAllEmployeesQuery();
    const { data: holidayData } = useGetHolidayQuery({ page: 1, limit: 100 });

    const leaveTypes = useMemo(() => configData?.data || [], [configData]);
    const leaves = useMemo(() => myLeavesData?.data || [], [myLeavesData]);
    const teamLeaves = useMemo(() => allLeavesData?.data || [], [allLeavesData]);

    const myEmpRecord = useMemo(() => 
        allEmpsData?.data?.find(e => e.userId === user?.id), 
    [allEmpsData, user]);

    const [calendarDate, setCalendarDate] = useState(new Date());

    const { data: weeklyOffData } = useGetWeeklyOffQuery({
        month: calendarDate.getMonth() + 1,
        year: calendarDate.getFullYear(),
        shiftId: myEmpRecord?.shiftId || 'all'
    });

    // Helper: Is this date a non-working day?
    const checkIsNonWorkingDay = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const dayOfWeek = d.getDay();
        const isStandardWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun/Sat

        const wData = weeklyOffData?.data || weeklyOffData?.result || [];
        const isCustomWeeklyOff = wData.some(woff => {
            const wDate = new Date(woff.date).toISOString().split('T')[0];
            return wDate === dateStr;
        });

        const hData = holidayData?.data || (Array.isArray(holidayData) ? holidayData : []);
        const isPublicHoliday = hData.some(h => {
            const hDate = new Date(h.date).toISOString().split('T')[0];
            return hDate === dateStr;
        });

        return isStandardWeekend || isCustomWeeklyOff || isPublicHoliday;
    };

    const { register, handleSubmit, control, watch, setValue, reset } = useForm();

    const fromDate = watch('fromDate');
    const toDate = watch('toDate');
    const isHalfDay = watch('isHalfDay');
    
    const [totalDays, setTotalDays] = useState(0);

    // Calculate actual working days
    useEffect(() => {
        if (fromDate && toDate) {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            
            if (end >= start) {
                if (isHalfDay) {
                    setTotalDays(0.5);
                    return;
                }

                let count = 0;
                let cur = new Date(start);
                while (cur <= end) {
                    const ds = cur.toISOString().split('T')[0];
                    if (!checkIsNonWorkingDay(ds)) {
                        count++;
                    }
                    cur.setDate(cur.getDate() + 1);
                }
                setTotalDays(count);
            } else {
                setTotalDays(0);
            }
        }
    }, [fromDate, toDate, isHalfDay, weeklyOffData, holidayData]);

    const onSubmit = async (data) => {
        try {
            if (totalDays <= 0) {
                return toast.error("Invalid date range");
            }

            const payload = {
                userId: user?.id,
                leaveType: data.leaveType,
                fromDate: data.fromDate,
                toDate: data.toDate,
                reason: data.reason,
                leavePlan: 'planned',
                status: 'PENDING'
            };

            await applyLeave(payload).unwrap();
            toast.success("Leave application submitted successfully!");
            navigate('/hrms/leave/dashboard'); 
        } catch (err) {
            toast.error("Failed to submit leave application");
            
        }
    };

    return (
        <div className="p-4 md:p-8  bg-slate-50 dark:bg-slate-800 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
                
                {/* Left Form Section */}
                <Card className="flex-1 p-6">
                    <h3 className="text-lg font-bold mb-6 border-b pb-3">Leave Application Form</h3>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Leave Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Leave Type</label>
                            <Controller
                                name="leaveType"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <CustomSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder={isConfigsLoading ? "Loading types..." : "Select Leave Type"}
                                        options={leaveTypes.map(type => ({
                                            value: type.leaveType.code,
                                            label: `${type.leaveType.name} (${type.leaveType.code})`
                                        }))}
                                    />
                                )}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">From Date</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input type="date" className="pl-10" {...register("fromDate", { required: true })} />
                                </div>
                                {fromDate && checkIsNonWorkingDay(fromDate) && (
                                    <p className="text-[10px] font-bold text-rose-500 uppercase mt-1 animate-pulse">
                                        ⚠️ Select a working day as Start Date
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">To Date</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input type="date" className="pl-10" {...register("toDate", { required: true })} />
                                </div>
                                {toDate && checkIsNonWorkingDay(toDate) && (
                                    <p className="text-[10px] font-bold text-rose-500 uppercase mt-1 animate-pulse">
                                        ⚠️ Select a working day as End Date
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Total Days & Half Day */}
                        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border">
                            <div>
                                <span className="text-sm text-slate-500 font-medium">Total: </span>
                                <span className="font-bold text-lg">{totalDays} Days</span>
                            </div>
                            <div className="flex items-center space-x-2">
                               <Controller
                                  name="isHalfDay"
                                  control={control}
                                  render={({ field }) => (
                                      <Checkbox 
                                        id="halfday" 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange} 
                                      />
                                  )}
                                />
                                <label htmlFor="halfday" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Is Half Day?
                                </label>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Reason for Leave</label>
                            <Textarea 
                                placeholder="Enter the reason for leave (required)" 
                                className="resize-none h-24"
                                {...register("reason", { required: true })}
                            />
                        </div>



                         {/* Reporting Manager */}
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Reporting Manager</label>
                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
                                <UserCircle2 className="w-10 h-10 text-slate-400" />
                                <div>
                                    <p className="text-sm font-bold">Assigned Manager</p>
                                    <p className="text-xs text-slate-500">Automatically routed based on workflow</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="px-6">Cancel</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Right Sidebar - Calendar Widget */}
                <div className="w-full lg:w-[400px] space-y-6">
                     <Card className="p-1 border-none shadow-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-primary" /> Leave Calendar
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Weekend</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-100" />
                                        <span className="text-[8px] font-black text-rose-400 uppercase">Holiday</span>
                                    </div>
                                </div>
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
                        <div className="p-3">
                            <Calendar
                                mode="single"
                                selected={calendarDate}
                                onSelect={setCalendarDate}
                                className="rounded-xl border-none p-2 w-full rdp-team-calendar"
                                components={{
                                    DayButton: ({ day, modifiers, className, ...props }) => {
                                        const d = day.date;
                                        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                        
                                        const activeLeaves = Array.from(new Set(
                                            (isAdmin ? teamLeaves : leaves)
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
                                                        isHoliday ? "bg-rose-50 text-rose-600 border border-rose-100" :
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
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                }}
                            />
                            
                            <div className="px-4 py-4 flex flex-wrap gap-4 border-t border-slate-50 dark:border-slate-800 mt-2">
                                <div className="flex items-center gap-1.5 ring-1 ring-slate-100 dark:ring-slate-800 rounded-full py-1 px-3 bg-slate-50/50">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Casual</span>
                                </div>
                                <div className="flex items-center gap-1.5 ring-1 ring-slate-100 dark:ring-slate-800 rounded-full py-1 px-3 bg-slate-50/50">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Sick</span>
                                </div>
                                <div className="flex items-center gap-1.5 ring-1 ring-slate-100 dark:ring-slate-800 rounded-full py-1 px-3 bg-slate-50/50">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Privileged</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10 border-none shadow-lg">
                        <h4 className="font-black text-primary uppercase tracking-widest text-[11px] mb-2 flex items-center gap-2">
                           Company Leave Policy
                        </h4>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 font-bold">
                            <li>• Apply 2 days in advance for short leaves.</li>
                        </ul>
                    </Card>
                </div>

            </div>
        </div>
    );
};
