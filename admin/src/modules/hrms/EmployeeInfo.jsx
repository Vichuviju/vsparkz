import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  User,
  Calendar,
  MapPin,
  Globe,
  IdCard,
  Clock,
  Edit,
  Trash2,
  ArrowLeft,
  FileText,
  CreditCard,
  Banknote,
  ShieldCheck,
  Building2,
  History,
  Check,
  X
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDate, cn } from "@/lib/utils";
import { useGetEmployeeByIdQuery, useGetSalaryHistoryQuery } from "@/services/hrms/employee.api";
import { useGetApprovalLogsQuery, useGetAllRequestsQuery } from "@/services/hrms/workflow.api";
import { getProfileImageUrl } from "@/services/base/base.api";
import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";
import { IncrementModal } from "./IncrementModal";

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-full border text-emerald-600">
      <Icon size={16} />
    </div>
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  </div>
);

const ApprovalTracker = ({ requestId, allRequests }) => {
  const request = allRequests?.find(r => r.requestId === requestId || r.id === requestId);
  if (!request || !request.workflowLevels) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit Approval Progress</p>
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 uppercase text-[9px] font-black tracking-tighter">
          {request.currentLevel} of {request.totalLevels} Steps
        </Badge>
      </div>

      <div className="relative space-y-4 pl-3 mt-4">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
        
        {request.workflowLevels.map((lvl, idx) => {
          const isCompleted = request.status === 'APPROVED' || lvl.levelNumber < request.currentLevel;
          const isActive = request.status === 'PENDING' && lvl.levelNumber === request.currentLevel;
          const isRejected = request.status === 'REJECTED' && lvl.levelNumber === request.currentLevel;

          return (
            <div key={idx} className="relative flex items-start gap-4">
              <div className={cn(
                "relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0",
                isCompleted ? "bg-emerald-500 text-white" :
                isActive ? "bg-blue-600 text-white" :
                isRejected ? "bg-rose-500 text-white" :
                "bg-slate-200 text-slate-400"
              )}>
                {isCompleted ? <Check size={10} /> : 
                 isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> :
                 isRejected ? <X size={10} /> :
                 <span className="text-[8px] font-bold">{lvl.levelNumber}</span>
                }
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-[11px] font-black uppercase tracking-tight",
                  isActive ? "text-blue-600" : isCompleted ? "text-slate-600" : "text-slate-400"
                )}>
                  {lvl.levelName || (lvl.approverType === 'REPORTING_MANAGER' ? 'Manager Approval' : 'Admin Approval')}
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {lvl.approverName || (lvl.approverType === 'REPORTING_MANAGER' ? 'Reporting Manager' : 'System Admin')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const EmployeeDetails = () => {
  const [activeTab, setActiveTab] = useState("Personal Info");
   const { id } = useParams(); // 👈 gets "3"
   const navigate = useNavigate();
   const { checkPermission, isLoading: isRbacLoading } = useHRMSPermissions();
   const { data: employee, isLoading: isEmployeeLoading } = useGetEmployeeByIdQuery(id);
    const e = employee?.data ?? {};
     const { data: historyRes, isLoading: isHistoryLoading } = useGetSalaryHistoryQuery(id, { skip: activeTab !== "Salary History" });
    const salaryHistory = historyRes?.data ?? [];

    const { data: allRequestsData } = useGetAllRequestsQuery();
    const allRequests = allRequestsData?.data || [];
    const pendingExitRequest = allRequests.find(r => r.module === 'TERMINATION' && String(r.entityId) === String(id) && r.status === 'PENDING');
   
   const canEdit = checkPermission('/hrms/core', 'edit');
   const canDelete = checkPermission('/hrms/core', 'delete');
   const canOfferLetter = checkPermission('/hrms/core', 'offer_letter');
   const canIncrementLetter = checkPermission('/hrms/core', 'increment_letter');
   const canAddIncrement = checkPermission('/hrms/core', 'add_increment');

   const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);



   const val = (v) => v ?? "—";

  const tabs = [
    "Personal Info",
    "Employment",
    "Salary History",
  ];

  const TAB_CONTENT = {
  "Personal Info": [
    { icon: Mail, label: "Email", value: e.email },
    { icon: Phone, label: "Mobile", value: e.phoneNumber },
    { icon: User, label: "Emergency Contact", value: e.emergencyPhone ? `${e.emergencyName} (${e.emergencyRelation}) - ${e.emergencyPhone}` : "—" },
    { icon: User, label: "Gender", value: e.gender },
    { icon: Globe, label: "Nationality", value: e.nationality },
    { icon: IdCard, label: "Passport / ID", value: e.passportNumber },
    { icon: User, label: "Marital Status", value: e.maritalStatus },
  ],

  Employment: [
    {
      title: "Professional Details",
      items: [
        { icon: IdCard, label: "Employee Code", value: e.empCode },
        { icon: User, label: "Designation", value: e.designation },
        { icon: Building2, label: "Department", value: val(e.departmentName) },
        { icon: User, label: "Reporting Manager", value: val(e.managerName) },
        { icon: Calendar, label: "Joining Date", value: formatDate(e.joiningDate) },
        { icon: Clock, label: "Employment Type", value: e.employmentType },
        { icon: MapPin, label: "Work Location", value: e.workLocation },
        { icon: Calendar, label: "Last Working Day", value: e.terminationDate ? formatDate(e.terminationDate) : "—" },
        { icon: Clock, label: "Status", value: e.status },
      ]
    },
    {
      title: "Statutory & Bank Information",
      items: [
        { icon: ShieldCheck, label: "PF Number", value: e.pfNumber },
        { icon: ShieldCheck, label: "ESI Number", value: e.esiNumber },
        { icon: Building2, label: "Bank Name", value: e.bankName },
        { icon: CreditCard, label: "Account Number", value: e.accountNumber },
        { icon: CreditCard, label: "IFSC Code", value: e.ifscCode }
      ]
    },
    {
      title: "Salary Breakdown",
      items: [
        { icon: Banknote, label: "Basic Salary", value: e.basicSalary },
        { icon: CreditCard, label: "DA", value: e.da },
        { icon: CreditCard, label: "HRA", value: e.hraAllowance },
        { icon: CreditCard, label: "Travel Allowance", value: e.travelAllowance },
        { icon: CreditCard, label: "Special Allowance", value: e.specialAllowance },
        { icon: CreditCard, label: "Other Allowance", value: e.otherAllowance },
        { icon: Banknote, label: "Total Monthly Salary", value: e.totalSalary },
      ]
    }
  ],
};

//   Assets: [
//     { icon: IdCard, label: "Assets", value: "—" },
//   ],




  const handleEditEmployee = () => {
    navigate("/hrms/core/add-employee", {
      state: {
        employee: e,   // 👈 full employee object
        mode: "edit"
      }
    });
  };


  if (isEmployeeLoading || isRbacLoading) {
  return <div className="p-6 text-muted-foreground">Loading employee...</div>;
}


  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
       <div className="flex items-center justify-between">
  {/* Left: Back + Title */}
  <div className="flex items-center gap-3">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(-1)}
      className="rounded-full"
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>

  </div>

  {/* Right Actions */}
  <div className="flex items-center gap-3">
    <Badge
      variant="secondary"
      className={cn(
        "px-3 py-1 uppercase text-[10px] font-black tracking-widest",
        e.terminationStatus === "PENDING" ? "bg-amber-100 text-amber-700" : 
        e.terminationStatus === "SETTLEMENT_PENDING" ? "bg-blue-100 text-blue-700 border-blue-200" :
        "bg-emerald-100 text-emerald-700"
      )}
    >
      {e.terminationStatus === "PENDING" ? "Exit Pending" : 
       e.terminationStatus === "SETTLEMENT_PENDING" ? "Settlement Pending" :
       (e.status || "Active")}
    </Badge>

    {canOfferLetter && (
      <Button
        variant="outline"
        className="gap-2 bg-white hover:bg-slate-50 border-blue-200 text-blue-700"
        onClick={() => navigate(`/hrms/employee/${id}/offer-letter`)}
      >
        <FileText className="h-4 w-4" />
        Offer Letter
      </Button>
    )}

    {canAddIncrement && (
      <Button
        variant="outline"
        className="gap-2 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
        onClick={() => setIsIncrementModalOpen(true)}
      >
        <Banknote className="h-4 w-4" />
        Add Increment
      </Button>
    )}

    {canIncrementLetter && (
      <Button
        variant="outline"
        className="gap-2 bg-white hover:bg-slate-50 border-orange-200 text-orange-700"
        onClick={() => navigate(`/hrms/employee/${id}/increment-letter`)}
      >
        <FileText className="h-4 w-4" />
        Increment Letter
      </Button>
    )}

    {canEdit && (
      <Button 
        size="icon" 
        variant="outline" 
        onClick={handleEditEmployee}
        title="Edit Record"
      >
        <Edit className="h-4 w-4" />
      </Button>
    )}

    {canDelete && (
      <Button 
        size="icon" 
        variant="destructive"
        title="Delete Record"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>
</div>


        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">

          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* Left Profile Card */}
            <Card className="overflow-hidden border-none shadow-xl bg-white/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <div className="relative group w-32 h-32 mb-6 flex items-center justify-center">
                  {e.profileImage ? (
                    <img 
                      src={getProfileImageUrl(e.profileImage)} 
                      alt={`${e.firstName} ${e.lastName}`} 
                      className="w-full h-full rounded-full object-cover border-4 border-blue-50 shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg uppercase tracking-wider">
                      {e.firstName ? e.firstName[0] : "?"}
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {val(e.firstName)} {val(e.lastName)}
                </h2>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                  ID: {e.empCode}
                </span>

                  <p className="text-sm text-muted-foreground mt-2">
                  {val(e.designation)}
                 </p>

                <Separator className="my-6" />

                <div className="w-full space-y-4 text-left">
                  <div className="flex justify-between">
                    <DetailItem icon={Calendar} label="Date of Birth" value={formatDate(e.dateOfBirth)} />
                  </div>

                  <DetailItem icon={Phone} label="Contact" value={val(e.phoneNumber)} />
                </div>
              </CardContent>
            </Card>

            {pendingExitRequest && (
              <ApprovalTracker 
                requestId={pendingExitRequest.requestId || pendingExitRequest.id} 
                allRequests={allRequests} 
              />
            )}
          </div>

          {/* Right Content */}
          <div className="space-y-6">

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
            </div>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>{activeTab}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {activeTab === "Personal Info" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {TAB_CONTENT[activeTab].map((item, idx) => (
                        <DetailItem
                          key={idx}
                          icon={item.icon}
                          label={item.label}
                          value={val(item.value)}
                        />
                      ))}
                    </div>
                  ) : activeTab === "Salary History" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="p-3 text-xs font-bold uppercase text-slate-500">Effective Date</th>
                            <th className="p-3 text-xs font-bold uppercase text-slate-500">Gross Salary</th>
                            <th className="p-3 text-xs font-bold uppercase text-slate-500 text-emerald-600">Increment</th>
                            <th className="p-3 text-xs font-bold uppercase text-slate-500">Basic</th>
                            <th className="p-3 text-xs font-bold uppercase text-slate-500">HRA</th>
                            <th className="p-3 text-xs font-bold uppercase text-slate-500 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salaryHistory.length > 0 ? (
                            salaryHistory.map((h, idx) => {
                              const nextRecord = salaryHistory[idx + 1];
                              const increment = nextRecord 
                                ? Number(h.totalSalary) - Number(nextRecord.totalSalary)
                                : 0;

                              return (
                                <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                                  <td className="p-3 text-sm font-medium">{formatDate(h.effectiveFrom)}</td>
                                  <td className="p-3 text-sm font-bold text-blue-600">₹{Number(h.totalSalary).toLocaleString()}</td>
                                  <td className="p-3 text-sm">
                                    {increment > 0 ? (
                                      <span className="text-emerald-600 font-bold">
                                        +₹{increment.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-sm">₹{Number(h.basicSalary).toLocaleString()}</td>
                                  <td className="p-3 text-sm">₹{Number(h.hraAllowance).toLocaleString()}</td>
                                  <td className="p-3 text-sm text-right flex items-center justify-end gap-2">
                                    {canIncrementLetter && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Download Increment Letter"
                                        onClick={() => navigate(`/hrms/employee/${id}/increment-letter/${h.id}`)}
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {h.isCurrent ? (
                                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Current</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-slate-400">Past</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                No salary history records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       {TAB_CONTENT[activeTab].map((section, sIdx) => (
                         <div key={sIdx} className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                               <span className="w-1 h-4 bg-blue-600 rounded-full" />
                               {section.title}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                               {section.items.map((item, idx) => (
                                 <DetailItem
                                   key={idx}
                                   icon={item.icon}
                                   label={item.label}
                                   value={val(item.value)}
                                 />
                               ))}
                            </div>
                            {sIdx < TAB_CONTENT[activeTab].length - 1 && <Separator className="mt-8 opacity-50" />}
                         </div>
                       ))}

                       {/* Documents Section inside Employment Tab */}
                       <div className="space-y-4 pt-4">
                          <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                             <span className="w-1 h-4 bg-blue-600 rounded-full" />
                             Compliance Documents
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.isArray(e.documents) && e.documents.length > 0 ? (
                              e.documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={getProfileImageUrl(doc)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group"
                                >
                                  <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-gray-900 truncate">
                                      Document {idx + 1}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium truncate uppercase tracking-wider">
                                      {doc?.split(".").pop() || 'File'}
                                    </span>
                                  </div>
                                </a>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground italic col-span-full py-2">
                                No documents uploaded for this employee.
                              </p>
                            )}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <IncrementModal 
        isOpen={isIncrementModalOpen} 
        onClose={() => setIsIncrementModalOpen(false)} 
        employee={e} 
      />
    </div>
  );
}
