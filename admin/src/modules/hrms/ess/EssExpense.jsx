import React, { useState, useMemo } from "react";
import { 
    Plus, 
    Wallet, 
    Clock, 
    CheckCircle2, 
    TrendingUp, 
    Filter, 
    Search, 
    FileText,
    Receipt,
    ArrowUpRight,
    X,
    Calendar,
    CreditCard,
    AlertCircle
} from "lucide-react";
import { 
    useGetMyExpensesQuery, 
    useCreateExpensesMutation 
} from "@/services/hrms/expense.api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { formatIndianCurrency } from "@/utils/formatIndianCurrency";

const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${colorClass}`}>
                <Icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtext}</p>
    </div>
);

export const EssExpense = () => {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const { data: expensesData, isLoading } = useGetMyExpensesQuery({ page, limit: 10 });
    const [createExpense, { isLoading: isCreating }] = useCreateExpensesMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        category: "TRAVEL",
        amount: "",
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMode: "CASH",
        description: ""
    });

    const stats = useMemo(() => {
        if (!expensesData?.data) return { total: 0, pending: 0, approved: 0 };
        const data = expensesData.data;
        return {
            total: data.reduce((acc, curr) => acc + Number(curr.amount), 0),
            pending: data.filter(e => e.status === 'SUBMITTED').length,
            approved: data.filter(e => e.status === 'HR_APPROVED' || e.status === 'PAID').length
        };
    }, [expensesData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createExpense({
                ...formData,
                userId: user.id
            }).unwrap();
            toast.success("Expense claim submitted successfully!");
            setIsModalOpen(false);
            setFormData({
                category: "TRAVEL",
                amount: "",
                expenseDate: new Date().toISOString().split('T')[0],
                paymentMode: "CASH",
                description: ""
            });
        } catch (error) {
            toast.error(error.data?.message || "Failed to submit claim");
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    {/* <h1 className="text-3xl font-black text-slate-800 tracking-tight">Expense Claims</h1> */}
                    <p className="text-sm text-slate-500 font-medium">Submit and track your business reimbursements</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-100 active:scale-95"
                >
                    <Plus size={20} />
                    New Claim
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    icon={Wallet} 
                    label="Total Claimed" 
                    value={formatIndianCurrency(stats.total)} 
                    subtext="Aggregate of all claims"
                    colorClass="bg-slate-50 text-slate-600"
                />
                <StatCard 
                    icon={Clock} 
                    label="Pending Review" 
                    value={stats.pending} 
                    subtext="Awaiting manager approval"
                    colorClass="bg-amber-50 text-amber-600"
                />
                <StatCard 
                    icon={CheckCircle2} 
                    label="Approved" 
                    value={stats.approved} 
                    subtext="Processed for payment"
                    colorClass="bg-emerald-50 text-emerald-600"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-800">Recent Claims</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-lg">
                        <Filter size={14} /> {expensesData?.total || 0} Total
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="px-8 py-4">Expense Details</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-center">Amount</th>
                                <th className="px-8 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold animate-pulse">Loading claims...</td></tr>
                            ) : expensesData?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Receipt size={48} />
                                            <p className="font-black text-slate-800">No claims found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                expensesData?.data && expensesData.data.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Receipt size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 leading-tight">{expense.category}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 truncate max-w-[200px]">
                                                        {expense.description || "No description provided"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    expense.status === 'PAID' ? 'bg-emerald-500' :
                                                    expense.status === 'SUBMITTED' ? 'bg-amber-500' :
                                                    expense.status === 'REJECTED' ? 'bg-rose-500' : 'bg-blue-500'
                                                }`} />
                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">
                                                    {expense.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <p className="text-sm font-black text-slate-800">{formatIndianCurrency(expense.amount)}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{expense.paymentMode}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-slate-800">
                                                    {new Date(expense.expenseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                    Applied: {new Date(expense.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-300 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">New Expense Claim</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submission Form</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-800 focus:ring-2 ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="TRAVEL">Travel</option>
                                        <option value="FOOD">Food</option>
                                        <option value="ACCOMMODATION">Accommodation</option>
                                        <option value="MEDICAL">Medical</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input 
                                            type="number"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-8 pr-4 text-sm font-bold text-slate-800 focus:ring-2 ring-blue-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="date"
                                            required
                                            value={formData.expenseDate}
                                            onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                                            className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-slate-800 focus:ring-2 ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <select 
                                            value={formData.paymentMode}
                                            onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                                            className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-slate-800 focus:ring-2 ring-blue-500 outline-none transition-all"
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="CARD">Card</option>
                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-800 focus:ring-2 ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Enter details of the expense..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Attachment</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                toast.success(`${file.name} selected`);
                                                setFormData({...formData, billFile: file});
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full h-20 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 group-hover:bg-white group-hover:border-blue-400 transition-all">
                                        <FileText size={20} className="text-slate-400 group-hover:text-blue-600 mb-1" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Click to upload receipt (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 p-5 rounded-2xl flex gap-4 border border-amber-100/50">
                                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                                    Policy Reminder: All claims above ₹500 require a valid physical or digital receipt for audit compliance.
                                </p>
                            </div>

                            <button 
                                type="submit"
                                disabled={isCreating}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50"
                            >
                                {isCreating ? "Submitting..." : "Submit Claim Request"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
