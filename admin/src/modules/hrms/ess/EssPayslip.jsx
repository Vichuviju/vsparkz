import React, { useState, useMemo, useEffect } from "react";
import { 
  Download, 
  Printer, 
  Lock, 
  ChevronRight, 
  FileText, 
  BadgeCheck, 
  Search, 
  Filter, 
  CalendarDays, 
  Mail, 
  FileSpreadsheet, 
  LifeBuoy, 
  Headset,
  ChevronLeft,
  Settings,
  TrendingUp,
  Clock,
  BarChart2,
  Calendar,
  Users,
  LogOut,
  Bell,
  MoreVertical,
  Phone,
  User,
  CheckCircle,
  Briefcase,
  LayoutDashboard
} from "lucide-react";

import { useGetPayoutsQuery, useGetPayrollRecordsQuery } from "@/services/hrms/salaryManagement.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useAuth } from "@/hooks/useAuth";
import { formatIndianCurrency } from "@/utils/formatIndianCurrency";
import { formatDate } from "@/utils/formatDate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-hot-toast";
import moment from "moment";

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const fmtMonth = (p) => {
  if (!p) return "";
  try {
    if (typeof p === 'object') {
      const dateStr = p.period ? `${p.period}-01` : `${p.year || new Date().getFullYear()}-${p.month}-01`;
      return new Date(dateStr).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    }
    const d = new Date(p + "-01");
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return String(p);
  }
};

// ── Payslip PDF Viewer (Rendered HTML) ───────────────────────────────────────
const PayslipPdfView = ({ payout, records, user }) => {
  if (!payout) return (
    <div className="flex flex-col items-center justify-center h-80 text-slate-400 text-sm bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm p-8">
      <FileText size={40} className="mb-3 opacity-20" />
      <p className="font-bold">Select a payslip from the archive to preview</p>
      <p className="text-[10px] opacity-60">Click on any period in the sidebar to view details</p>
    </div>
  );

  const myRecord = records?.find((r) => r.employeeId === user?.id) || records?.[0] || null;
  if (!myRecord) return (
    <div className="bg-white rounded-3xl p-8 text-center text-slate-400 shadow-sm border border-slate-100 flex items-center justify-center h-80">
      <div className="animate-pulse flex flex-col items-center">
         <div className="w-10 h-10 bg-slate-50 rounded-full mb-3"></div>
         <p className="font-bold text-sm">Loading record details...</p>
      </div>
    </div>
  );

  const earnings = typeof myRecord.earningsBreakdown === 'string' ? JSON.parse(myRecord.earningsBreakdown) : (myRecord.earningsBreakdown || {});
  const deductions = typeof myRecord.deductionsBreakdown === 'string' ? JSON.parse(myRecord.deductionsBreakdown) : (myRecord.deductionsBreakdown || {});
  const monthLabel = fmtMonth(payout);

  const earningEntries = Object.entries(earnings).filter(([, v]) => Number(v) > 0);
  const deductionEntries = [
    { label: "Loss of Pay", value: deductions.lopAmount, color: "text-rose-600" },
    { label: "Loan EMI", value: deductions.totalEmi, color: "text-rose-600" },
    { label: "PF Contribution", value: deductions.pfEmployee || deductions.pf },
    { label: "ESI Contribution", value: deductions.esiEmployee || deductions.esi },
    { label: "Professional Tax", value: deductions.professionalTax || deductions.pt },
  ].filter(d => Number(d.value) > 0);

  const maxRows = Math.max(earningEntries.length, deductionEntries.length);
  const tableRows = [];
  for (let i = 0; i < maxRows; i++) {
    tableRows.push({
      earning: earningEntries[i] || null,
      deduction: deductionEntries[i] || null
    });
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative group transition-all hover:shadow-lg hover:shadow-slate-200/50">
      {/* Official Design Preview */}
      <div className="p-6 md:p-10 max-w-[850px] mx-auto bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">SECURE CODE SYSTEMS</h1>
            <div className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              <p>No:21, A.K.R Nagar 3rd Street, Sridevikuppam,</p>
              <p>ValasaraVakkam, Chennai-600 087.</p>
              <p className="mt-1 text-blue-600"><span className="text-slate-400">PAN:</span> AOPPY8739K <span className="mx-2 opacity-30">|</span> <span className="text-slate-400">GSTIN:</span> 33AOPPY8739K1ZV</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">SALARY SLIP</h2>
            <p className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-md mt-1 inline-block">{monthLabel}</p>
          </div>
        </div>

        <div className="h-[2px] bg-slate-900 w-full mb-8" />

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-10 mb-8">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Employee Name</p>
              <p className="text-sm font-black text-slate-800">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Payable Days</p>
              <p className="text-sm font-black text-slate-800">{myRecord.payableDays || '-'} <span className="text-slate-400 font-bold ml-1">of {myRecord.totalDays || '-'}</span></p>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Employee Code</p>
              <p className="text-sm font-black text-slate-800">{myRecord.empCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pay Period</p>
              <p className="text-sm font-black text-slate-800">{monthLabel}</p>
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="border-2 border-slate-900 rounded-lg overflow-hidden mb-8 shadow-sm">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-900">
                <th className="p-3 text-left font-black text-slate-900 border-r-2 border-slate-900 w-1/4 uppercase tracking-widest">EARNINGS</th>
                <th className="p-3 text-right font-black text-slate-900 border-r-2 border-slate-900 w-1/4 uppercase tracking-widest">AMOUNT</th>
                <th className="p-3 text-left font-black text-slate-900 border-r-2 border-slate-900 w-1/4 uppercase tracking-widest">DEDUCTIONS</th>
                <th className="p-3 text-right font-black text-slate-900 w-1/4 uppercase tracking-widest">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                  <td className="p-3 border-r-2 border-slate-900 text-slate-500 font-bold">{row.earning?.[0] || ""}</td>
                  <td className="p-3 border-r-2 border-slate-900 text-right font-black text-slate-800">{row.earning ? `₹${Number(row.earning[1]).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ""}</td>
                  <td className="p-3 border-r-2 border-slate-900 text-slate-500 font-bold">{row.deduction?.label || ""}</td>
                  <td className={`p-3 text-right font-black ${row.deduction?.color || "text-slate-800"}`}>
                    {row.deduction ? `₹${Number(row.deduction.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ""}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t-2 border-slate-900">
                <td className="p-4 text-left font-black text-slate-900 border-r-2 border-slate-900 text-[10px] uppercase tracking-widest" colSpan={1}>
                  GROSS EARNINGS
                </td>
                <td className="p-4 text-right font-black text-blue-700 border-r-2 border-slate-900 text-xs" colSpan={1}>
                  ₹{Number(myRecord.grossSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-left font-black text-slate-900 border-r-2 border-slate-900 text-[10px] uppercase tracking-widest" colSpan={1}>
                  TOTAL DEDUCTIONS
                </td>
                <td className="p-4 text-right font-black text-rose-600 text-xs" colSpan={1}>
                  ₹{Number(myRecord.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Pay Highlight */}
        <div className="flex border-2 border-emerald-500 bg-emerald-50/30 rounded-xl overflow-hidden mb-8 shadow-sm shadow-emerald-100">
          <div className="w-1/2 p-5 flex items-center font-black text-emerald-700 text-[10px] uppercase tracking-[0.2em]">
            NET PAY (AMOUNT RECEIVABLE)
          </div>
          <div className="w-1/2 p-5 text-right flex items-center justify-end">
            <p className="text-2xl font-black text-emerald-700 tracking-tighter">
              ₹{Number(myRecord.netPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-6 border-t border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 italic">This is a computer-generated payout advice and does not require a physical signature.</p>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Subject to Chennai Jurisdiction | E. & O.E.</p>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const EssPayslip = () => {
  const { user } = useAuth();
  const { data: payouts = [], isLoading } = useGetPayoutsQuery();
  const sortedPayouts = [...payouts].reverse();
  const [selected, setSelected] = useState(null);
  const [activeView, setActiveView] = useState("preview");

  // Auto-select latest
  useEffect(() => {
    if (sortedPayouts.length > 0 && !selected) {
      setSelected(sortedPayouts[0]);
    }
  }, [sortedPayouts.length, selected]);

  const { data: records = [] } = useGetPayrollRecordsQuery(selected?.id, { skip: !selected?.id });
  const { data: employeesList } = useGetAllEmployeesQuery({ userId: user?.id }, { skip: !user?.id });
  const employee = employeesList?.data?.[0] || {};

  const myRecord = records?.find?.((r) => r.employeeId === user?.id) || records?.[0] || null;
  const netPay = Number(myRecord?.netPay || 0);

  // Calculate Taxes from myRecord
  const deductions = useMemo(() => {
    if (!myRecord) return {};
    return typeof myRecord.deductionsBreakdown === 'string' 
      ? JSON.parse(myRecord.deductionsBreakdown) 
      : (myRecord.deductionsBreakdown || {});
  }, [myRecord]);

  const totalTax = Number(deductions.professionalTax || deductions.pt || 0) + Number(deductions.tds || 0);

  // YTD Calculation
  const currentYear = new Date().getFullYear();
  const ytdEarnings = useMemo(() => {
    return payouts
      .filter(p => {
        const pYear = p.period ? p.period.split('-')[0] : p.year;
        return Number(pYear) === currentYear;
      })
      .reduce((acc, p) => acc + Number(p.totalNetPay || p.netPay || 0), 0);
  }, [payouts, currentYear]);

  const handleDownloadPdf = () => {
    if (!selected || !myRecord) return;
    const monthLabel = fmtMonth(selected);
    const earnings = typeof myRecord.earningsBreakdown === 'string' ? JSON.parse(myRecord.earningsBreakdown) : (myRecord.earningsBreakdown || {});
    const currentDeductions = deductions;

    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'fixed'; printWindow.style.right = '0'; printWindow.style.bottom = '0'; printWindow.style.width = '0'; printWindow.style.height = '0'; printWindow.style.border = '0';
    document.body.appendChild(printWindow);

    const earningEntries = Object.entries(earnings).filter(([, v]) => Number(v) > 0);
    const deductionEntries = [
      { label: "Loss of Pay", value: currentDeductions.lopAmount },
      { label: "Loan EMI", value: currentDeductions.totalEmi },
      { label: "PF Contribution", value: currentDeductions.pfEmployee || currentDeductions.pf },
      { label: "ESI Contribution", value: currentDeductions.esiEmployee || currentDeductions.esi },
      { label: "Professional Tax", value: currentDeductions.professionalTax || currentDeductions.pt },
    ].filter(d => Number(d.value) > 0);

    const maxRows = Math.max(earningEntries.length, deductionEntries.length, 5);

    const payslipHTML = `
      <html>
        <head>
          <title>Payslip - ${monthLabel}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            .brand h1 { margin: 0; font-size: 24px; font-weight: 900; tracking-tight: -1px; }
            .brand p { margin: 4px 0; font-size: 11px; color: #64748b; font-weight: 500; }
            .title-box { text-align: right; }
            .title-box h2 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; }
            .title-box p { margin: 4px 0; font-size: 14px; font-weight: 800; color: #4f46e5; }
            .divider { height: 2px; background: #0f172a; margin: 30px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .info-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
            .info-value { font-size: 14px; font-weight: 800; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; border: 2px solid #0f172a; margin-bottom: 30px; }
            th { background: #f8fafc; padding: 12px; text-align: left; font-size: 11px; font-weight: 900; border-bottom: 2px solid #0f172a; border-right: 2px solid #0f172a; }
            td { padding: 10px 12px; font-size: 11px; border-bottom: 1px solid #e2e8f0; border-right: 2px solid #0f172a; font-weight: 600; }
            .net-box { display: flex; border: 2px solid #10b981; background: #f0fdf4; border-radius: 8px; overflow: hidden; }
            .net-label { flex: 1; padding: 15px; font-weight: 900; color: #15803d; font-size: 11px; text-transform: uppercase; }
            .net-value { flex: 1; padding: 15px; text-align: right; font-weight: 900; color: #15803d; font-size: 24px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; }
            .footer p { font-size: 10px; color: #94a3b8; font-weight: 600; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <h1>SECURE CODE SYSTEMS</h1>
              <p>No:21, A.K.R Nagar 3rd Street, Sridevikuppam,<br/>ValasaraVakkam, Chennai-600 087.</p>
              <p><b>PAN:</b> AOPPY8739K | <b>GSTIN:</b> 33AOPPY8739K1ZV</p>
            </div>
            <div class="title-box">
              <h2>SALARY SLIP</h2>
              <p>${monthLabel}</p>
            </div>
          </div>
          <div class="divider"></div>
          <div class="info-grid">
            <div>
              <div class="info-label">Employee Name</div>
              <div class="info-value">${user?.firstName} ${user?.lastName}</div>
              <div style="margin-top:15px" class="info-label">Payable Days</div>
              <div class="info-value">${myRecord.payableDays || '-'} of ${myRecord.totalDays || '-'}</div>
            </div>
            <div style="text-align:right">
              <div class="info-label">Employee Code</div>
              <div class="info-value">${myRecord.empCode || 'N/A'}</div>
              <div style="margin-top:15px" class="info-label">Period</div>
              <div class="info-value">${monthLabel}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>EARNINGS</th>
                <th style="text-align:right">AMOUNT</th>
                <th>DEDUCTIONS</th>
                <th style="border-right:0; text-align:right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: maxRows }).map((_, i) => {
                const e = earningEntries[i] || null;
                const d = deductionEntries[i] || null;
                return `
                  <tr>
                    <td>${e ? e[0] : ""}</td>
                    <td style="text-align:right">${e ? '₹' + Number(e[1]).toLocaleString('en-IN', {minimumFractionDigits:2}) : ""}</td>
                    <td>${d ? d.label : ""}</td>
                    <td style="border-right:0; text-align:right">${d ? '₹' + Number(d.value).toLocaleString('en-IN', {minimumFractionDigits:2}) : ""}</td>
                  </tr>`;
              }).join('')}
              <tr style="background:#f8fafc;font-weight:900;">
                <td style="border-bottom:0">GROSS EARNINGS</td>
                <td style="border-bottom:0;text-align:right;color:#4f46e5">₹${Number(myRecord.grossSalary).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td style="border-bottom:0">TOTAL DEDUCTIONS</td>
                <td style="border-bottom:0;border-right:0;text-align:right;color:#dc2626">₹${Number(myRecord.totalDeductions).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>
          <div class="net-box">
            <div class="net-label">Net Pay (Amount Receivable)</div>
            <div class="net-value">₹${Number(myRecord.netPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="footer">
            <p>This is a computer-generated payout advice and does not require a physical signature.</p>
            <p style="text-transform:uppercase;letter-spacing:2px">Subject to Chennai Jurisdiction | E. & O.E.</p>
          </div>
          <script>window.onload=()=>{setTimeout(()=>{window.print();setTimeout(()=>{window.frameElement.parentNode.removeChild(window.frameElement);},500);},500);};</script>
        </body>
      </html>
    `;
    printWindow.contentDocument.write(payslipHTML);
    printWindow.contentDocument.close();
    toast.success("Preparing PDF Document...");
  };

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 font-urbanist text-slate-900 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
        
        {/* Welcome Banner */}
        <div className="relative bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden flex items-center justify-between">
           <div className="space-y-2 relative z-10">
              <p className="text-slate-400 font-bold text-xs">Welcome back,</p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                {user?.firstName} {user?.lastName} <span className="text-2xl">👋</span>
              </h1>
              <p className="text-slate-400 font-medium text-xs">Access, view and download your payslips securely in one place.</p>
           </div>
           
           <div className="flex items-center gap-4 relative z-10">
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 flex flex-col items-center justify-center shadow-inner">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{currentYear}</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">Payslip Center</p>
              </div>
           </div>

           <div className="absolute right-[30%] top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none hidden md:block">
              <FileText size={100} className="text-blue-600" />
           </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Net Payable", value: formatIndianCurrency(netPay, 2), sub: "Latest month payout", icon: BadgeCheck, color: "text-emerald-500", bg: "bg-emerald-50", badge: "Processed" },
            { label: "Year-to-Date", value: formatIndianCurrency(ytdEarnings, 2), sub: "Total earnings in 2024", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50", badge: "Accumulated" },
            { label: "Taxes Paid", value: formatIndianCurrency(totalTax, 2), sub: "Monthly tax deduction", icon: BarChart2, color: "text-rose-500", bg: "bg-rose-50", badge: "Compliant" },
            { label: "Next Payout", value: "01 May", sub: "Expected payment date", icon: Clock, color: "text-orange-500", bg: "bg-orange-50", badge: "Upcoming" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                 <div className={`w-10 h-10 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <kpi.icon size={20} />
                 </div>
                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${kpi.bg} ${kpi.color}`}>{kpi.badge}</span>
              </div>
              <div className="space-y-0.5">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                 <p className="text-2xl font-black text-slate-800 tracking-tighter">{kpi.value}</p>
                 <p className="text-[10px] font-bold text-slate-400">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Main Content Area */}
          <div className="xl:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-[20px] border border-slate-100 shadow-inner">
                   {["preview", "archive"].map(tab => (
                     <button
                       key={tab}
                       onClick={() => setActiveView(tab)}
                       className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-none ${
                         activeView === tab ? "bg-white text-blue-600 shadow-md shadow-blue-100" : "text-slate-400 hover:text-slate-600"
                       }`}
                     >
                       {tab === "preview" ? "Payslip Preview" : "Payout History"}
                     </button>
                   ))}
                </div>

                <div className="flex items-center gap-3">
                   {selected && (
                     <div className="flex items-center gap-2">
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-5 py-2.5 !bg-blue-600 !text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:!bg-blue-700 transition-all shadow-lg shadow-blue-100 border-none">
                           <Download size={14} /> Download PDF
                        </button>
                        <button onClick={handleDownloadPdf} className="p-2.5 !bg-white border !border-slate-200 rounded-xl hover:!border-blue-500 transition-all !text-slate-500 border-none shadow-sm"><Printer size={16}/></button>
                     </div>
                   )}
                </div>
             </div>

             {activeView === 'preview' ? (
               <PayslipPdfView payout={selected} records={records} user={user} />
             ) : (
               <div className="space-y-6 max-h-[400px] overflow-y-auto styled-scrollbar px-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedPayouts.map(p => (
                      <div key={p.id} onClick={() => {setSelected(p); setActiveView("preview");}} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer group ${selected?.id === p.id ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                         <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected?.id === p.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                  <CalendarDays size={16} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-800 tracking-tight">{fmtMonth(p)}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Processed Payout</p>
                               </div>
                            </div>
                            <ChevronRight size={16} className={selected?.id === p.id ? 'text-blue-600' : 'text-slate-300'} />
                         </div>
                         <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest">Successful</span>
                            <span className="text-sm font-black text-slate-700">{formatIndianCurrency(p.totalNetPay || p.netPay || 0)}</span>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 space-y-6">
             
             {/* Profile Card */}
             <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="relative mb-6 group">
                   <Avatar className="w-20 h-20 ring-8 ring-slate-50 border-[3px] border-white shadow-xl transition-transform group-hover:scale-105">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=fff&size=256`} />
                      <AvatarFallback className="bg-blue-600 text-white font-black text-xl uppercase">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                   </Avatar>
                   <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-[3px] border-white rounded-full shadow-lg" />
                </div>
                
                <div className="mb-6">
                   <h3 className="text-lg font-black text-slate-800 tracking-tight">{user?.firstName} {user?.lastName}</h3>
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{employee?.designation || "Admin"}</p>
                </div>

                <div className="w-full space-y-4 text-left border-t border-slate-50 pt-6">
                   {[
                     { label: "Employee ID", value: employee?.empCode || "EMP-01KM", icon: User },
                     { label: "Department", value: employee?.departmentName || employee?.department || "Administration", icon: Briefcase },
                     { label: "Join Date", value: "01 Jan 2020", icon: Calendar },
                     { label: "Tax Regime", value: "New Regime", icon: FileText },
                     { label: "Bank Account", value: "**** **** 8829", icon: BadgeCheck },
                   ].map((item, i) => (
                     <div key={i} className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                           <item.icon size={14} />
                           <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-800 text-right">{item.value}</span>
                     </div>
                   ))}
                </div>


             </div>





          </div>

        </div>
      </div>
    </div>
  );
};
