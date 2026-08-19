import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetApprovalLogsQuery } from "@/services/hrms/workflow.api";
import { Clock, CheckCircle2, XCircle, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export const ExpenseAuditModal = ({ open, setOpen, expense }) => {
  const { data: logs = [], isLoading } = useGetApprovalLogsQuery(
    { module: 'EXPENSE', entityId: expense?.id },
    { skip: !expense?.id }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Approval History
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            Detailed audit trail for {expense?.category} claim (₹{Number(expense?.amount).toLocaleString()})
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-400 italic">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400 italic">No history recorded yet.</div>
          ) : (
            <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 ml-2">
              {logs.map((log, idx) => (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute -left-[25px] w-4 h-4 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                    log.action === 'APPROVED' ? "bg-emerald-500" : 
                    log.action === 'REJECTED' ? "bg-rose-500" : "bg-indigo-500"
                  )} />

                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                        log.action === 'APPROVED' ? "bg-emerald-100 text-emerald-700" : 
                        log.action === 'REJECTED' ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
                      )}>
                        {log.action}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{log.approverName || 'System'}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Step {log.level}</p>
                        
                        {log.remark && (
                          <div className="mt-3 flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-100 italic">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 leading-relaxed">{log.remark}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Submission Step (Static) */}
              <div className="relative">
                <div className="absolute -left-[25px] w-4 h-4 rounded-full border-4 border-white bg-slate-300 shadow-sm" />
                <div className="p-4 border border-dashed rounded-xl border-slate-200">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">SUBMITTED</p>
                   <p className="text-sm font-bold text-slate-900">{expense?.employeeName}</p>
                   <p className="text-[10px] text-slate-400">{formatDate(expense?.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
