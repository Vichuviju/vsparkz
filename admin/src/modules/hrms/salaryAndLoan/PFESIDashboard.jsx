import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Activity,
  Calculator,
  ArrowRight,
  FileText,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  BarChart3,
  Receipt,
  FileBadge,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetStatutoryReportQuery, useGetPayrollRunsQuery } from "@/services/hrms/salaryManagement.api";
import { useGetHrSettingsQuery } from "@/services/hrms/hrSettings.api";
import { Button } from "@/components/ui/button";

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

function daysFromNow(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function DaysBadge({ days }) {
  if (days <= 7) return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">{days} days left</span>
  );
  if (days <= 20) return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">{days} days left</span>
  );
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">{days} days left</span>
  );
}

// ─── Simple SVG Donut Chart ─────────────────────────────────────────────────
function DonutChart({ compliant, actionRequired, overdue }) {
  const total = compliant + actionRequired + overdue || 1;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const seg = (val) => (val / total) * circ;

  const segments = [
    { val: compliant,      color: "#22c55e", offset: 0 },
    { val: actionRequired, color: "#f97316", offset: seg(compliant) },
    { val: overdue,        color: "#ef4444", offset: seg(compliant) + seg(actionRequired) },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        {segments.map(({ val, color, offset }, i) => (
          <circle
            key={i}
            cx={70} cy={70} r={r}
            fill="none"
            stroke={color}
            strokeWidth={18}
            strokeDasharray={`${seg(val)} ${circ - seg(val)}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-gray-900">{compliant + actionRequired + overdue}</span>
        <span className="text-[10px] text-gray-500 font-semibold">Total</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const PFESIDashboard = () => {
  const navigate = useNavigate();
  const [selectedRunId, setSelectedRunId] = useState("");

  const { data: runsResponse } = useGetPayrollRunsQuery();
  const { data: reportResponse, isLoading } = useGetStatutoryReportQuery(selectedRunId, {
    skip: !selectedRunId,
  });

  const runs = runsResponse || [];
  const report = reportResponse || [];

  // ── Period selector ──────────────────────────────────────────────────────
  const uniqueMonths = useMemo(() => {
    const byMonth = {};
    for (const run of runs) {
      const key = `${run.year}-${run.month}`;
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(run);
    }
    return Object.values(byMonth).map((ms) => {
      return ms.find((r) => r.runType === "MONTHLY") || ms[0];
    }).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  }, [runs]);

  useMemo(() => {
    if (uniqueMonths.length > 0 && !selectedRunId) {
      const now = new Date();
      const currentMonthRun = uniqueMonths.find(r => r.year === now.getFullYear() && r.month === now.getMonth() + 1);
      setSelectedRunId(currentMonthRun?.id || uniqueMonths[0].id);
    }
  }, [uniqueMonths, selectedRunId]);

  // ── Stats from report ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!report.length) return { pfEE: 0, pfER: 0, esiEE: 0, esiER: 0, ptTotal: 0, pfCount: 0, esiCount: 0 };
    return report.reduce((acc, curr) => ({
      pfEE:    acc.pfEE    + Number(curr.pfEmployee || 0),
      pfER:    acc.pfER    + Number(curr.pfEmployer || 0) + Number(curr.pfAdminCharges || 0) + Number(curr.pfEdliCharges || 0),
      esiEE:   acc.esiEE   + Number(curr.esiEmployee || 0),
      esiER:   acc.esiER   + Number(curr.esiEmployer || 0),
      ptTotal: acc.ptTotal + Number(curr.professionalTax || 0),
      pfCount: acc.pfCount + (curr.pfEmployee > 0 ? 1 : 0),
      esiCount: acc.esiCount + (curr.isEsiEligible === "YES" ? 1 : 0),
    }), { pfEE: 0, pfER: 0, esiEE: 0, esiER: 0, ptTotal: 0, pfCount: 0, esiCount: 0 });
  }, [report]);

  // ── Compliance snapshot (derived from stats) ──────────────────────────────
  const compliant       = [stats.pfEE > 0, stats.esiEE > 0].filter(Boolean).length;
  const actionRequired  = stats.ptTotal > 0 ? 1 : 0;
  const overdue         = 0;

  // ── Upcoming deadlines (computed from current period) ────────────────────
  const { data: hrSettingsRes } = useGetHrSettingsQuery();
  const configDeadlines = hrSettingsRes?.data?.statutoryDeadlines || { pf: 15, esi: 15, pt: 30 };

  const currentRun   = uniqueMonths.find((r) => r.id === selectedRunId);
  const periodYear   = currentRun?.year  || new Date().getFullYear();
  const periodMonth  = currentRun?.month || new Date().getMonth() + 1;
  const nextMonth    = new Date(periodYear, periodMonth, 1); // 1st of next month

  const deadlines = [
    {
      label: "Provident Fund (ECR)",
      sub:   `Due for ${new Date(periodYear, periodMonth - 2).toLocaleString("default", { month: "long", year: "numeric" })}`,
      date:  new Date(periodYear, periodMonth - 1, configDeadlines.pf || 15).toISOString(),
      color: "text-blue-600",
      bg:    "bg-blue-50",
      icon:  <ShieldCheck size={18} className="text-blue-600" />,
    },
    {
      label: "ESI Contribution",
      sub:   `Due for ${new Date(periodYear, periodMonth - 2).toLocaleString("default", { month: "long", year: "numeric" })}`,
      date:  new Date(periodYear, periodMonth - 1, configDeadlines.esi || 15).toISOString(),
      color: "text-rose-600",
      bg:    "bg-rose-50",
      icon:  <Activity size={18} className="text-rose-600" />,
    },
    {
      label: "Professional Tax Payment",
      sub:   `Due for ${new Date(periodYear, periodMonth - 2).toLocaleString("default", { month: "long", year: "numeric" })}`,
      date:  new Date(periodYear, periodMonth - 1, configDeadlines.pt || 30).toISOString(),
      color: "text-amber-600",
      bg:    "bg-amber-50",
      icon:  <Calculator size={18} className="text-amber-600" />,
    },
  ];

  const periodLabel = currentRun
    ? new Date(currentRun.year, currentRun.month - 1).toLocaleString("default", { month: "long", year: "numeric" })
    : "—";

  // ── Quick actions ────────────────────────────────────────────────────────
  const quickActions = [
    { icon: <FileText size={22} className="text-blue-500" />, label: "Generate PF ECR",    sub: "Create PF ECR file",         onClick: () => navigate("/hrms/compliance/pf") },
    { icon: <Receipt   size={22} className="text-rose-500"   />, label: "Generate ESI Challan", sub: "Create ESI payment challan", onClick: () => navigate("/hrms/compliance/esi") },
    { icon: <FileBadge size={22} className="text-amber-500"  />, label: "Professional Tax Report", sub: "View PT summary report",   onClick: () => navigate("/hrms/compliance/pt") },
    { icon: <BarChart3 size={22} className="text-green-500"  />, label: "Payroll Summary",   sub: "View monthly payroll summary", onClick: () => navigate("/hrms/payroll") },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#f5f7fa] min-h-screen font-sans">

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          {/* <h1 className="text-2xl font-black text-gray-900 tracking-tight">Statutory Compliance</h1> */}
          <p className="text-sm text-gray-500 mt-0.5">Overview of statutory obligations and compliance status</p>
        </div>

        {/* Period picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Calendar size={15} className="text-gray-400" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase leading-none">Current Period</p>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer mt-0.5"
            >
              {uniqueMonths.map((run) => (
                <option key={run.id} value={run.id}>
                  {new Date(run.year, run.month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 3-Column Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* PF Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="text-white" size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Provident Fund</h3>
                <p className="text-xs text-blue-500 font-semibold">{stats.pfCount} Members</p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/hrms/compliance/pf")} 
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="w-9 h-9 rounded-xl transition-all shadow-md shadow-blue-200 hover:opacity-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Employee Share</p>
              <p className="text-xl font-black text-gray-900">₹{fmt(stats.pfEE)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Employer Share</p>
              <p className="text-xl font-black text-gray-900">₹{fmt(stats.pfER)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Liability</p>
            <p className="text-base font-black text-blue-600">₹{fmt(stats.pfEE + stats.pfER)}</p>
          </div>
        </div>

        {/* ESI Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-500 rounded-xl flex items-center justify-center">
                <Activity className="text-white" size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">ESI Insurance</h3>
                <p className="text-xs text-rose-500 font-semibold">{stats.esiCount} Members</p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/hrms/compliance/esi")} 
              style={{ backgroundColor: '#f43f5e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="w-9 h-9 rounded-xl transition-all shadow-md shadow-rose-200 hover:opacity-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Employee (0.75%)</p>
              <p className="text-xl font-black text-gray-900">₹{fmt(stats.esiEE)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Employer (3.25%)</p>
              <p className="text-xl font-black text-gray-900">₹{fmt(stats.esiER)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Liability</p>
            <p className="text-base font-black text-rose-600">₹{fmt(stats.esiEE + stats.esiER)}</p>
          </div>
        </div>

        {/* PT Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center">
                <Calculator className="text-white" size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Professional Tax</h3>
                <p className="text-xs text-amber-500 font-semibold">Slab-Based</p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/hrms/compliance/pt")} 
              style={{ backgroundColor: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="w-9 h-9 rounded-xl transition-all shadow-md shadow-amber-200 hover:opacity-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>

          <div className="mb-5">
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Total Monthly Deduction</p>
            <p className="text-3xl font-black text-gray-900">₹{fmt(stats.ptTotal)}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filing Required</p>
            </div>
            <button onClick={() => navigate("/hrms/compliance/pt")} className="text-xs font-bold text-amber-600 hover:underline">
              State Slabs
            </button>
          </div>
        </div>
      </div>

      {/* ── Compliance Readiness Banner ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-blue-100 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-0.5">Compliance Readiness</h4>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            The figures shown above are aggregated from processed payroll runs for the selected period.
            Ensure that all PF/ESI deductions are reconciled with the monthly payroll summary before filing the ECR on the government portals.
          </p>
        </div>
      </div>

      {/* ── Middle Row: Snapshot + Deadlines ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Compliance Snapshot */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 text-sm mb-5">Compliance Snapshot</h4>
          <div className="flex items-center gap-8">
            <DonutChart
              compliant={compliant}
              actionRequired={actionRequired}
              overdue={overdue}
            />
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600 font-medium">Compliant</span>
                </div>
                <span className="font-bold text-gray-900">{compliant}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <span className="text-sm text-gray-600 font-medium">Action Required</span>
                </div>
                <span className="font-bold text-gray-900">{actionRequired}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600 font-medium">Overdue</span>
                </div>
                <span className="font-bold text-gray-900">{overdue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-gray-900 text-sm">Upcoming Deadlines</h4>
            <span className="text-xs text-gray-400 font-medium">{periodLabel}</span>
          </div>

          <div className="space-y-3">
            {deadlines.map((d, i) => {
              const days = daysFromNow(d.date);
              const dateStr = new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${d.bg} flex items-center justify-center`}>
                      {d.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                      <p className="text-xs text-gray-400">{d.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700 hidden sm:block">{dateStr}</span>
                    <DaysBadge days={days} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-5">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50/40 hover:border-blue-100 transition-all group text-left"
            >
              <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:shadow-md transition-shadow">
                {a.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{a.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{a.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
