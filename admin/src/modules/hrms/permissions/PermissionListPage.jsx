import React, { useState, useMemo } from 'react';
import { useSelector } from "react-redux";
import { 
    Clock, 
    Calendar, 
    History, 
    Check, 
    X, 
    AlertCircle, 
    Info,
    User,
    ArrowRight,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { 
    useCreatePermissionMutation, 
    useGetMyPermissionsQuery, 
    useDeletePermissionMutation 
} from '@/services/hrms/permission.api.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";


const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        {children}
    </div>
);

const CircularProgress = ({ value, max }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
                <circle
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                />
                <circle
                    className="text-blue-600 transition-all duration-500 ease-in-out"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-slate-800">{value}h</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Used</span>
            </div>
        </div>
    );
};

export const PermissionListPage = () => {
    const user = useSelector((state) => state.user?.user);
    const userId = user?.id;

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        reason: '',
    });

    const [page, setPage] = useState(1);
    const limit = 5;

    const { data: myData, isLoading } = useGetMyPermissionsQuery({ page, limit });
    const [createPermission, { isLoading: isSubmitting }] = useCreatePermissionMutation();
    const [deletePermission] = useDeletePermissionMutation();

    const requests = myData?.data || [];

    const usedHours = myData?.monthlyUsed || 0;
    const monthlyLimit = myData?.monthlyLimit || 4;
    const totalPages = Math.ceil((myData?.total || 0) / limit);

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        
        // Basic duration check
        const [h1, m1] = formData.startTime.split(':').map(Number);
        const [h2, m2] = formData.endTime.split(':').map(Number);
        const duration = (h2 + m2 / 60) - (h1 + m1 / 60);

        if (duration <= 0) return toast.error("End time must be after start time");
        if (usedHours + duration > monthlyLimit) {
            return toast.error(`Monthly limit exceeded. You have ${monthlyLimit - usedHours}h remaining.`);
        }

        try {
            await createPermission({
                ...formData,
                userId,
                userName: `${user?.firstName} ${user?.lastName}`,
                duration
            }).unwrap();
            
            toast.success("Permission request submitted successfully");
            setFormData({
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '10:00',
                reason: '',
            });
        } catch (err) {
            toast.error(err?.data?.message || "Error submitting request");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to cancel this request?")) return;
        try {
            await deletePermission(id).unwrap();
            toast.success("Request cancelled");
        } catch (err) {
            toast.error("Failed to cancel request");
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className=" bg-slate-50 dark:bg-slate-800 p-4 md:p-8 text-slate-900 font-sans">
            <div className="max-w-full mx-auto space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Left: Application Form */}
                    <Card className="p-8">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Clock size={20} />
                            </div>
                            <h3 className="text-lg font-bold">Apply Hourly Permission</h3>
                        </div>

                        <form onSubmit={handleRequestSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Permission</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input 
                                        type="date" 
                                        className="pl-10"
                                        required 
                                        value={formData.date} 
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Time</label>
                                    <Input 
                                        type="time" 
                                        required 
                                        value={formData.startTime} 
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Time</label>
                                    <Input 
                                        type="time" 
                                        required 
                                        value={formData.endTime} 
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Permission</label>
                                <Textarea 
                                    required 
                                    rows="3" 
                                    placeholder="Briefly explain your requirement..."
                                    className="resize-none"
                                    value={formData.reason} 
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })} 
                                />
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-4 items-start">
                                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-700 leading-relaxed font-medium">
                                    Permission requests are automatically routed to your reporting manager via the Workflow Engine.
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full py-6 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Application"}
                            </Button>
                        </form>
                    </Card>

                    {/* Right: Tracker & History */}
                    <div className="space-y-8">
                        
                        {/* Tracker Circle */}
                        <Card className="p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white to-slate-50">
                            <CircularProgress value={usedHours} max={monthlyLimit} />
                            <div className="space-y-4 text-center md:text-left">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800">Monthly Tracker</h4>
                                    <p className="text-sm text-slate-500 font-medium">Resetting in {30 - new Date().getDate()} days</p>
                                </div>
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Limit</p>
                                        <p className="text-xl font-bold text-slate-700">{monthlyLimit}h</p>
                                    </div>
                                    <div className="h-10 w-px bg-slate-200" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
                                        <p className="text-xl font-bold text-emerald-600">{Math.max(0, monthlyLimit - usedHours)}h</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-amber-100">
                                    <AlertCircle size={10} /> Policies apply for excess usage
                                </div>
                            </div>
                        </Card>

                        {/* History Table */}
                        <Card className="overflow-hidden">
                            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Permission History</h3>
                                <History size={16} className="text-slate-400" />
                            </div>
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b whitespace-nowrap">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Slot</th>
                                            <th className="px-6 py-3">Hrs</th>
                                            <th className="px-6 py-3">Reason</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {requests.length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">No recent history</td></tr>
                                        ) : requests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">
                                                    {formatDate(req.date)}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                                                    {req.startTime} - {req.endTime}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    {req.duration}h
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-slate-500 max-w-[150px] truncate" title={req.reason}>
                                                        {req.reason}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`${
                                                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                                        req.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                    } border-none shadow-none text-[10px] font-bold uppercase tracking-widest px-2 py-0`}>
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.status === 'Pending' && (
                                                        <button 
                                                            onClick={() => handleDelete(req.id)}
                                                            className="text-[9px] text-rose-500 hover:text-rose-600 hover:underline font-bold uppercase"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t bg-slate-50/30 flex items-center justify-between">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Page {page} of {totalPages || 1}
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 hover:bg-white"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 hover:bg-white"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
};