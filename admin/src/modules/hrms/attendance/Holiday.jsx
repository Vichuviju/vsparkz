// import React, { useState } from "react"
// import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react"
// import { useNavigate } from "react-router-dom"
// import { HolidayModal } from "@/components/modals/hrms/holiday/HolidayModal"
// import {
//   useGetHolidayQuery,
//   useDeleteHolidayMutation,
// } from "@/services/hrms/holiday.api"
// import { toast } from "sonner"
// import { Button } from "@/components/ui/button"   // ✅ shadcn button

// export const HolidayView = () => {
//   const navigate = useNavigate()

//   const [modalOpen, setModalOpen] = useState(false)
//   const [editData, setEditData] = useState(null)

//   const { data, isLoading } = useGetHolidayQuery()
//   const [deleteHoliday] = useDeleteHolidayMutation()

//   const holidays = data?.data || data || []

//   const handleEdit = (holiday) => {
//     setEditData(holiday)
//     setModalOpen(true)
//   }

//   const handleDelete = async (id) => {
//     try {
//       await deleteHoliday(id).unwrap()
//       toast.success("Holiday deleted successfully")
//     } catch (error) {
//       toast.error("Failed to delete holiday")
//     }
//   }

//   return (
//     <>
//       <div className="px-6 py-6 space-y-6">

//         {/* Header */}
//         <div className="flex justify-between items-center">

//           {/* Back Button */}
//           <Button
//             variant="ghost"
//             onClick={() => navigate("/hrms/attendanceAll")}
//             className="text-emerald-600 flex items-center gap-1"
//           >
//             <ChevronLeft size={18} />
//             Back
//           </Button>

//           {/* Add Holiday Button */}
//           <Button
//             onClick={() => {
//               setEditData(null)
//               setModalOpen(true)
//             }}
//             className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
//           >
//             <Plus size={16} />
//             Add Holiday
//           </Button>
//         </div>

//         {/* Card */}
//         <div className="bg-white border rounded-xl shadow-sm">

//           <div className="px-6 py-5 border-b flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-gray-800">
//               Holiday Calendar
//             </h3>

//             <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">
//               {holidays.length} Total Holidays
//             </span>
//           </div>

//           {/* List */}
//           <div className="divide-y">
//             {isLoading && (
//               <div className="p-6 text-center text-gray-500">
//                 Loading holidays...
//               </div>
//             )}

//             {!isLoading && holidays.length === 0 && (
//               <div className="p-6 text-center text-gray-400">
//                 No holidays found
//               </div>
//             )}

//             {holidays.map((holiday) => (
//               <div
//                 key={holiday.id}
//                 className="px-6 py-5 flex items-center justify-between hover:bg-gray-50"
//               >
//                 <div className="flex items-center gap-4">

//                   {/* Date Badge */}
//                   <div className="w-14 h-14 bg-emerald-50 rounded-xl flex flex-col items-center justify-center text-emerald-600">
//                     <span className="text-[11px] font-semibold uppercase">
//                       {new Date(holiday.date).toLocaleString("default", {
//                         month: "short",
//                       })}
//                     </span>
//                     <span className="text-lg font-bold leading-none">
//                       {new Date(holiday.date).getDate()}
//                     </span>
//                   </div>

//                   {/* Info */}
//                   <div>
//                     <h4 className="text-gray-800 font-semibold">
//                       {holiday.holidayName}
//                     </h4>
//                     <p className="text-sm text-gray-500">
//                       {holiday.type} Holiday
//                     </p>
//                   </div>
//                 </div>

//                 {/* Actions */}
//                 <div className="flex items-center gap-2">

//                   {/* Edit Button */}
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => handleEdit(holiday)}
//                     className="hover:bg-emerald-50 hover:text-emerald-600"
//                   >
//                     <Pencil size={16} />
//                   </Button>

//                   {/* Delete Button */}
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => handleDelete(holiday.id)}
//                     className="hover:bg-red-50 hover:text-red-600"
//                   >
//                     <Trash2 size={16} />
//                   </Button>

//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       <HolidayModal
//         open={modalOpen}
//         setOpen={setModalOpen}
//         initialData={editData}
//       />
//     </>
//   )
// }

import React, { useState, useEffect, useMemo, useRef} from "react"
import { 
  ChevronLeft, 
  ChevronRight,
  Plus, 
  Pencil, 
  Trash2, 
  Calendar as CalendarIcon, 
  Settings2,
  Save,
  CheckCircle2,
  CalendarDays,
  Info,
  MapPin,
  List
} from "lucide-react"
import { HashRouter as Router, Routes, Route, useNavigate } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { toast, Toaster } from "sonner"

// Shadcn UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  useGetHolidayQuery,
  useDeleteHolidayMutation,
} from "@/services/hrms/holiday.api"
import {
  useGetWeeklyOffQuery,
  useSaveWeeklyOffMutation
} from "@/services/hrms/weeklyoff"
import { useGetHrSettingsQuery } from "@/services/hrms/hrSettings.api"
import { useGetShiftsQuery } from "@/services/hrms/shifts.api"
import { HolidayModal } from "@/components/modals/hrms/holiday/HolidayModal"

const getNthDayOfMonth = (date) => {
    const d = date.getDate();
    return Math.ceil(d / 7);
};

/**
 * MONTHLY CALENDAR VIEW - Integrated with Weekly Off Toggle
 */
const MonthCalendar = ({ holidays, weeklyOffDates, onToggleWeeklyOff, currentViewDate, canEdit, hrSettings, selectedShift }) => {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const currentYear = currentViewDate.getFullYear()
  const currentMonth = currentViewDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const normalizedFirstDay = firstDay === 0 ? 6 : firstDay - 1
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = []

    for (let i = 0; i < normalizedFirstDay; i++) {
      days.push({ type: 'empty' })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d)
      // Safe local date formatting (no timezone shift)
      const dsY = dateObj.getFullYear();
      const dsM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dsD = String(dateObj.getDate()).padStart(2, '0');
      const dateString = `${dsY}-${dsM}-${dsD}`;
      
      const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "short" })
      const nth = getNthDayOfMonth(dateObj)
      
      const holiday = holidays.find(h => h.date === dateString)
      const woEntry = weeklyOffDates.find(w => w.date === dateString)

      // Calculate the "Baseline" Off Status (what is standard for this date?)
      let isGlobalOff = false;

      // 1. Check Shift-Specific Rules first
      if (selectedShift) {
          const days = selectedShift.weeklyOffDays || [];
          const alt = selectedShift.altWeeklyOff || "None";

          // Check non-Saturday days first
          if (days.includes(dayOfWeek) && dayOfWeek !== "Sat") {
              isGlobalOff = true;
          }

          // Special Saturday Logic
          if (dayOfWeek === "Sat") {
              if (alt === "2nd Saturday") isGlobalOff = (nth === 2);
              else if (alt === "4th Saturday") isGlobalOff = (nth === 4);
              else if (alt === "2nd & 4th Saturday") isGlobalOff = (nth === 2 || nth === 4);
              else if (alt === "1st & 3rd Saturday") isGlobalOff = (nth === 1 || nth === 3);
              else if (alt === "All Saturdays") isGlobalOff = true;
              else if (alt === "None") isGlobalOff = days.includes("Sat"); 
              else isGlobalOff = days.includes("Sat"); // Default to toggle status
          }
      } 
      // 2. Fallback to Global (HR Settings) if no specific shift is selected ("All Shifts")
      else {
          const global = hrSettings?.GLOBAL_WEEKLY_OFF || {};
          const days = global.days || [];
          const alt = global.alt || "All Saturdays";

          if (days.includes(dayOfWeek)) {
              if (dayOfWeek === "Sat") {
                  // Global Alternate Pattern Matching
                  if (alt === "2nd and 4th Saturday") isGlobalOff = (nth === 2 || nth === 4);
                  else if (alt === "1st, 3rd & 5th Saturday") isGlobalOff = (nth === 1 || nth === 3 || nth === 5);
                  else isGlobalOff = true;
              } else {
                  isGlobalOff = true;
              }
          }
      }

      // Determine final type: Override takes precedence, otherwise Global
      const finalType = woEntry?.type || (isGlobalOff ? 'Full' : null);
      const isOverride = !!woEntry;

      days.push({
        day: d,
        dateString,
        isHoliday: !!holiday,
        holidayName: holiday?.holidayName,
        woType: finalType, 
        isOverride,
        isGlobalOff,
        isToday: new Date().toDateString() === dateObj.toDateString()
      })
    }
    return days
  }, [currentYear, currentMonth, holidays, weeklyOffDates, hrSettings, selectedShift])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-sm"></div>
                <span className="text-[11px] font-medium text-gray-500 uppercase">Full Off</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-sm"></div>
                <span className="text-[11px] font-medium text-gray-500 uppercase">Partial Off</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm"></div>
                <span className="text-[11px] font-medium text-gray-500 uppercase">Holiday</span>
            </div>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"></div>
                <span className="text-[11px] font-medium text-gray-500 uppercase">Working</span>
            </div>
        </div>
        <p className="text-[11px] text-gray-400 italic font-medium">Click on a date to toggle Weekly Off status</p>
      </div>
      <div className="grid grid-cols-7 border-t border-l rounded-xl overflow-hidden shadow-sm">
        {dayLabels.map(label => (
          <div key={label} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-r bg-gray-50/50">
            {label}
          </div>
        ))}
        {calendarDays.map((day, idx) => (
          <div 
            key={idx} 
            onClick={() => {
                if (!canEdit) return
                if (day.type !== 'empty') {
                    onToggleWeeklyOff(day.dateString, day)
                }
            }}
            className={`min-h-[110px] p-2 border-r border-b relative group transition-all select-none
                ${!canEdit ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                ${day.type === 'empty' ? 'bg-gray-50/30' :
                    day.isHoliday ? 'bg-blue-50/50 hover:bg-blue-100/60' :
                    day.woType === 'Full' ? 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-100/50' :
                    day.woType === 'Partial' ? 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-100/50' :
                    day.woType === 'Working' ? 'bg-white hover:bg-gray-50 border-blue-100 shadow-[inset_0_0_10px_rgba(79,70,229,0.02)]' :
                    'bg-white hover:bg-gray-50'
                }
            `}
          >
            {day.day && (
              <>
                <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold ${
                    day.isToday ? 'bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center -ml-1 -mt-1 shadow-sm' : 'text-gray-500'
                    }`}>
                    {day.day}
                    </span>
                    <div className="flex gap-1 items-center">
                        {day.isOverride && (
                            <div className="flex items-center justify-center w-5 h-5 bg-blue-50 text-blue-500 rounded-full border border-blue-100 shadow-sm" title="Regional Override Applied">
                                <Settings2 size={10} strokeWidth={3} />
                            </div>
                        )}
                        {day.woType && day.woType !== 'Working' && (
                            <CheckCircle2 size={14} className={day.woType === 'Full' ? "text-emerald-500" : "text-amber-500"} />
                        )}
                    </div>
                </div>
                
                <div className="mt-2 space-y-1">
                  {day.isHoliday && (
                    <div className="text-[9px] leading-tight font-black text-blue-700 bg-blue-200/50 px-1.5 py-1 rounded border border-blue-300 truncate uppercase tracking-tighter" title={day.holidayName}>
                      {day.holidayName}
                    </div>
                  )}
                  {day.woType && (
                    <div className={`text-[9px] leading-tight font-bold px-1.5 py-1 rounded border uppercase tracking-tighter shadow-sm flex items-center justify-between
                      ${day.woType === 'Full' ? 'text-emerald-700 bg-emerald-200 border-emerald-300' : 
                        day.woType === 'Partial' ? 'text-amber-700 bg-amber-200 border-amber-300' :
                        'text-blue-700 bg-blue-50 border-blue-200'}
                    `}>
                      {day.woType === 'Full' ? 'FULL OFF' : day.woType === 'Partial' ? 'HALF DAY OFF' : 'WORKING'}
                      {day.isOverride && <Settings2 size={8} />}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * MAIN VIEW COMPONENT
 */
export const HolidayView = () => {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [currentViewDate, setCurrentViewDate] = useState(new Date())
  const [district, setDistrict] = useState("CHENNAI")
  const [shiftId, setShiftId] = useState(""); // Initialize empty, will be set by useEffect
  const { data, isLoading } = useGetHolidayQuery()
  const [deleteHoliday] = useDeleteHolidayMutation()
  const { data: shiftsData } = useGetShiftsQuery()
  const { data: weeklyData } = useGetWeeklyOffQuery({
  region: district,
  month: currentViewDate.getMonth() + 1,
  year: currentViewDate.getFullYear(),
  shiftId: shiftId === 'all' ? null : shiftId
});    // No operational change needed
const [saveWeeklyOff, { isLoading: isSaving }] = useSaveWeeklyOffMutation();

  useEffect(() => {
    if (shiftsData?.data?.length > 0 && !shiftId) {
      setShiftId(String(shiftsData.data[0].id));
    }
  }, [shiftsData, shiftId]);


  const rawHolidays = useMemo(() => data?.data || data || [], [data]);
  const holidays = useMemo(() => {
    return rawHolidays.filter(h => {
        const matchesRegion = !district || district === 'all' || h.region === district || h.region === 'INDIA';
        const matchesShift = shiftId === 'all' ? true : (String(h.shiftId) === String(shiftId) || h.shiftId === null);
        return matchesRegion && matchesShift;
    });
  }, [rawHolidays, district, shiftId]);
  

  const [weeklyOffDates, setWeeklyOffDates] = useState([])

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const { data: settingsData } = useGetHrSettingsQuery();
  const globalWeeklyOff = settingsData?.data?.GLOBAL_WEEKLY_OFF;

  // Consolidate weekly off date processing into a single stable effect
  useEffect(() => {
    if (weeklyData?.result) {
      const dates = weeklyData.result.map(item => {
        // Safe mapping from backend date to local display date (YYYY-MM-DD)
        const dObj = new Date(item.date);
        const dsY = dObj.getFullYear();
        const dsM = String(dObj.getMonth() + 1).padStart(2, '0');
        const dsD = String(dObj.getDate()).padStart(2, '0');
        return {
          date: `${dsY}-${dsM}-${dsD}`,
          type: item.type || 'Full'
        };
      });

      // Avoid redundant state updates if data is identical
      if (JSON.stringify(weeklyOffDates) !== JSON.stringify(dates)) {
        setWeeklyOffDates(dates);
      }
    } else if (weeklyData && Array.isArray(weeklyData)) {
      if (JSON.stringify(weeklyOffDates) !== JSON.stringify(weeklyData)) {
        setWeeklyOffDates(weeklyData);
      }
    } else if (!weeklyData) {
      if (weeklyOffDates.length > 0) {
        setWeeklyOffDates([]);
      }
    }
  }, [weeklyData]);

  const handleToggleWeeklyOff = (dateString, currentDay) => {
    setWeeklyOffDates(prev => {
      const existing = prev.find(d => d.date === dateString);
      
      // Determine the "True Baseline" (what it would be if no override existed)
      const baseline = currentDay.isGlobalOff ? 'Full' : 'Working';

      if (!existing) {
          // If baseline is 'Full', first override is 'Partial'
          // If baseline is 'Working', first override is 'Full'
          const nextType = baseline === 'Full' ? 'Partial' : 'Full';
          return [...prev, { date: dateString, type: nextType }];
      } else if (existing.type === 'Full') {
          return prev.map(d => d.date === dateString ? { ...d, type: 'Partial' } : d);
      } else if (existing.type === 'Partial') {
          return prev.map(d => d.date === dateString ? { ...d, type: 'Working' } : d);
      } else {
          // 'Working' -> Reset (Remove entry to revert to baseline)
          return prev.filter(d => d.date !== dateString);
      }
    });
  };

  const handleSaveWeeklyOff = async () => {
  try {
    await saveWeeklyOff({
      region: district,
      shiftId: shiftId === 'all' ? null : shiftId,
      month: currentViewDate.getMonth() + 1,
      year: currentViewDate.getFullYear(),
      dates: weeklyOffDates,
    }).unwrap();

    toast.success("Weekly off updated successfully");
  } catch (error) {
    toast.error("Failed to save weekly off");
  }
};

   const handleEdit = (holiday) => {
    setEditData(holiday)
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    toast.error("Confirm Deletion", {
      description: "Are you sure you want to delete this holiday?",
      duration: 5000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteHoliday(id).unwrap();
            toast.success("Holiday deleted successfully");
          } catch (error) {
            toast.error("Failed to delete holiday");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };




  const changeMonth = (offset) => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  return (
    <div className="px-6 py-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/hrms/attendance/dashboard")}
          className="text-emerald-600 flex items-center gap-1 hover:bg-emerald-50"
        >
          <ChevronLeft size={18} />
          Back
        </Button>

        <div className="flex items-center gap-3">
         <div className="hidden items-center gap-3 bg-white border rounded-xl px-4 py-2 shadow-sm">
            <MapPin size={16} className="text-muted-foreground" />

            <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="w-[160px] border-none shadow-none focus:ring-0 text-sm font-medium">
                <SelectValue placeholder="Select Location" />
                </SelectTrigger>

                <SelectContent className="rounded-xl">
                <SelectItem value="CHENNAI">Chennai</SelectItem>
                <SelectItem value="BANGALORE">Bangalore</SelectItem>
                <SelectItem value="COIMBATORE">Coimbatore</SelectItem>
                </SelectContent>
            </Select>
         </div>

          <div className="flex items-center gap-3 bg-white border rounded-xl px-4 py-2 shadow-sm">
             <CalendarDays size={16} className="text-muted-foreground" />
             <Select value={shiftId} onValueChange={setShiftId}>
                 <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0 text-sm font-medium">
                    <SelectValue placeholder="Select Shift" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {shiftsData?.data?.map(shift => (
                        <SelectItem key={shift.id} value={String(shift.id)} className="text-xs font-bold py-2 focus:bg-blue-50 focus:text-blue-600">
                            ✨ {shift.shiftName}
                        </SelectItem>
                    ))}
                 </SelectContent>
             </Select>
          </div>


          <div className="flex items-center bg-white border rounded-lg p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="h-8 w-8"><ChevronLeft size={16} /></Button>
            <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center text-sm">
              {monthNames[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}
            </div>
            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="h-8 w-8"><ChevronRight size={16} /></Button>
          </div>
          <Button
            onClick={handleSaveWeeklyOff}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
            {isSaving ? "Saving..." : "Save Weekly Off"}
         </Button>
          <Button
            onClick={() => {
              setEditData(null)
              setModalOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            <Plus size={16} className="mr-2" />
            Add Holiday
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">

            <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex gap-3 items-center">
                <Info size={16} className="text-blue-500" />
                <span className="text-xs text-blue-700 font-medium leading-none">Changes are autosaved to current view</span>
            </div>
        </div>

        <Tabs defaultValue="calendar_grid" className="w-full">
         <div className="flex justify-between items-center mb-6">
            <TabsList className="bg-muted p-1 rounded-xl h-11">
            <TabsTrigger
                value="calendar_grid"
                className="rounded-lg px-6 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
                <CalendarIcon size={16} className="mr-2" />
                WeeK off calender
            </TabsTrigger>

            <TabsTrigger
                value="list"
                className="rounded-lg px-6 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
                <List size={16} className="mr-2" />
                Holiday List
            </TabsTrigger>
            </TabsList>
        </div>

          <TabsContent value="calendar_grid" className="mt-0">
            <div className="bg-white border rounded-2xl shadow-sm p-6">
              <MonthCalendar 
                holidays={holidays} 
                weeklyOffDates={weeklyOffDates} 
                onToggleWeeklyOff={handleToggleWeeklyOff}
                currentViewDate={currentViewDate} 
                canEdit={true}
                hrSettings={settingsData?.data || {}}
                selectedShift={shiftsData?.data?.find(s => String(s.id) === String(shiftId))}
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="animate-in fade-in-50 duration-500">
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y">
                {holidays.length > 0 ? (
                  holidays.map((holiday) => (
                    <div key={holiday.id} className="px-6 py-5 flex items-center justify-between hover:bg-emerald-50/20 group transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center text-emerald-700">
                          <span className="text-[10px] font-black uppercase tracking-wider">{new Date(holiday.date).toLocaleString("default", { month: "short" })}</span>
                          <span className="text-xl font-bold leading-none">{new Date(holiday.date).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-bold">{holiday.holidayName}</h4>
                          <div className="flex gap-2 mt-1">
                             <Badge variant="secondary" className="text-[10px] uppercase font-bold">{holiday.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(holiday)} className="text-gray-400 hover:text-emerald-600"><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-400 italic">No holidays configured for this month.</div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <HolidayModal open={modalOpen} setOpen={setModalOpen} initialData={editData} />
    </div>
  )
}