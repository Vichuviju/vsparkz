import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Camera,
  Edit2,
  AlertCircle,
  ChevronRight,
  User,
  Landmark,
  Shield,
  ShieldCheck,
  Calendar,
  Headset,
  Home,
  PhoneCall,
  Lock,
  FileText,
  IdCard,
  CreditCard,
  Book,
  Plus,
  MoreVertical,
  Bell,
  ExternalLink,
  Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetEmployeeByIdQuery, useUpdateEmployeeMutation, useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
};

const BreadcrumbHeader = ({ userName }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
      <Home size={12} />
      <span>Dashboard</span>
      <ChevronRight size={12} />
      <span className="text-blue-600">My Profile</span>
    </div>
    <div className="flex items-center justify-between">
      <div>
        {/* <h1 className="text-2xl font-black text-slate-800">My Profile</h1> */}
        <p className="text-xs font-bold text-slate-400 mt-1">View and manage your personal and professional information</p>
      </div>
      {/* <div className="flex items-center gap-4">
        <div className="relative cursor-pointer hover:bg-slate-200 p-2 rounded-full transition-colors bg-slate-100">
          <Bell size={18} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-100"></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden shadow-sm">
             {userName?.[0]?.toUpperCase() || "E"}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-black text-slate-800">{userName}</span>
            <span className="text-[10px] font-bold text-slate-400">Admin</span>
          </div>
          <ChevronRight size={14} className="text-slate-400 rotate-90" />
        </div>
      </div> */}
    </div>
  </div>
);

const ProfileInfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-3 text-slate-500">
      <Icon size={14} />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <span className="text-xs font-bold text-slate-800">{value}</span>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 flex-1 hover:bg-slate-50 p-2 rounded-xl transition-colors">
    <div className="text-blue-500">
      <Icon size={18} />
    </div>
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
  </button>
);

const ProfileSummaryCard = ({ name, designation, joinDate, empCode, uan, esi, bank, department, manager, email, phone, onEdit }) => (
  <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 flex flex-col">
    {/* Purple Gradient Header */}
    <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500 relative"></div>
    
    <div className="px-6 pb-6 relative flex flex-col items-center">
      {/* Avatar */}
      <div className="relative -mt-16 mb-6">
        <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-sm bg-blue-600 flex items-center justify-center text-white text-5xl font-black overflow-hidden">
          {name?.split(' ').map(n => n[0]).join('')?.slice(0, 2)?.toUpperCase() || "E"}
        </div>
      </div>
      
      {/* Name and Badge */}
      <h2 className="text-xl font-black text-slate-800">{name}</h2>
      <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black mt-2 uppercase tracking-widest">{designation || "Admin"}</span>
      
      {/* Horizontal Action Buttons */}
      <div className="w-full flex items-center justify-center border-y border-slate-50 mt-8 py-4 px-2">
         <ActionButton icon={Edit2} label="Edit Profile" onClick={onEdit} />
      </div>
      
      {/* Info List */}
      <div className="w-full mt-6 flex flex-col px-2 gap-1">
         <ProfileInfoRow icon={User} label="Employee ID" value={empCode} />
         <ProfileInfoRow icon={Shield} label="UAN Number" value={uan} />
         <ProfileInfoRow icon={ShieldCheck} label="ESI Number" value={esi} />
         <ProfileInfoRow icon={Calendar} label="Date of Joining" value={fmtDate(joinDate)} />
         <ProfileInfoRow icon={Home} label="Department" value={department || "Administration"} />
         <ProfileInfoRow icon={User} label="Designation" value={designation || "System Admin"} />
         <ProfileInfoRow icon={User} label="Reporting Manager" value={manager || "System Admin"} />
         <ProfileInfoRow icon={Mail} label="Email Address" value={email} />
         <ProfileInfoRow icon={Phone} label="Phone Number" value={phone} />
         <ProfileInfoRow icon={Landmark} label="Bank Account" value={bank} />
      </div>

    </div>
  </div>
);


const RightCardRow = ({ icon: Icon, label, value, fieldLabel, fieldValue, editing, draftData, setDraftData, hasChevron = false, className = "" }) => (
  <div className={`flex items-center justify-between py-4 border-b border-slate-50 last:border-0 ${className}`}>
    <div className="flex items-center gap-4 w-1/3 min-w-[140px]">
      {Icon && (
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-emerald-500">
          <Icon size={14} />
        </div>
      )}
      {editing && fieldLabel ? (
         <input 
            type="text" 
            className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full outline-none focus:border-blue-400 transition-colors"
            value={draftData[fieldLabel] || ''}
            onChange={(e) => setDraftData({ ...draftData, [fieldLabel]: e.target.value })}
            placeholder="Label"
         />
      ) : (
         <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      )}
    </div>
    <div className="flex items-center justify-end gap-3 flex-1">
      {editing && fieldValue ? (
        <input 
          type="text" 
          className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full outline-none focus:border-blue-400 transition-colors"
          value={draftData[fieldValue] || ''}
          onChange={(e) => setDraftData({ ...draftData, [fieldValue]: e.target.value })}
          placeholder="Value"
        />
      ) : (
        <>
          <span className="text-[13px] font-bold text-slate-800 text-right">{value}</span>
          {!editing && hasChevron && <ChevronRight size={14} className="text-slate-300" />}
        </>
      )}
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, icon: HeaderIcon, editing, onEdit, onSave, onCancel, children }) => (
  <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col gap-2">
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
          <HeaderIcon size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-colors">
            Save
          </button>
        </div>
      ) : onEdit ? (
        <button onClick={onEdit} className="flex items-center gap-2 border border-blue-100 text-blue-600 px-5 py-2.5 rounded-xl text-[11px] font-black hover:bg-blue-50 transition-colors uppercase tracking-widest">
          <Edit2 size={12} /> Edit
        </button>
      ) : null}
    </div>
    
    <div className="flex flex-col mt-2">
       {children}
    </div>
  </div>
);



export const EssProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: employeesList, isLoading: isListLoading } = useGetAllEmployeesQuery({ userId: user?.id }, { skip: !user?.id });
  const internalEmpId = employeesList?.data?.[0]?.id || null;

  // Fetch full profile with all fields
  const { data: fullEmpData, isLoading: isProfileLoading } = useGetEmployeeByIdQuery(internalEmpId, { skip: !internalEmpId });
  const [updateEmployee] = useUpdateEmployeeMutation();

  const isLoading = isListLoading || (internalEmpId && isProfileLoading);
  const emp = fullEmpData?.data || null;
  const empId = emp?.id || internalEmpId;


  if (isLoading) {
    return (
      <div className=" bg-slate-50 dark:bg-slate-800 p-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="h-[600px] bg-slate-200 rounded-[24px]" />
          </div>
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="h-64 bg-slate-200 rounded-[24px]" />
            <div className="h-48 bg-slate-200 rounded-[24px]" />
            <div className="h-48 bg-slate-200 rounded-[24px]" />
          </div>
        </div>
      </div>
    );
  }

  const name = emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : (`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Employee");
  const designation = emp?.designation || user?.role?.roleName || "Employee";
  const departmentName = emp?.departmentName || "—";
  const managerName = emp?.managerName || "—";
  const joinDate = emp?.joiningDate || emp?.createdAt;
  const empCode = emp?.empCode || "—";
  const uan = emp?.uan || "—";
  const esi = emp?.esiNumber || "—";
  const pfNumber = emp?.pfNumber || "—";
  const bank = emp?.accountNumber ? `XXXX XXXX ${String(emp.accountNumber).slice(-4)}` : "—";
  const bankName = emp?.bankName || "—";
  const ifscCode = emp?.ifscCode || "—";
  
  const phone = emp?.phoneNumber || "—";
  const email = emp?.email || user?.email || "—";
  const workLocation = emp?.workLocation || "—";
  const address = emp?.address || "—";
  const emergencyName = emp?.emergencyName || "—";
  const emergencyPhone = emp?.emergencyPhone || "—";
  const gender = emp?.gender || "—";
  const dob = emp?.dateOfBirth || "—";
  const employmentType = emp?.employmentType || "—";




  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6 md:p-8 font-urbanist text-slate-900">
      <Toaster position="top-right" />
      
      <BreadcrumbHeader userName={name} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (4 columns to match screenshot proportion) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
           <ProfileSummaryCard 
              name={name} 
              designation={designation} 
              department={departmentName}
              manager={managerName}
              joinDate={joinDate} 
              empCode={empCode} 
              uan={uan} 
              esi={esi} 
              bank={bank} 
              email={email}
              phone={phone}
              onEdit={() => navigate("/hrms/core/add-employee", { state: { employee: emp } })}
           />
        </div>

        {/* Right Column (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           <SectionCard 
             title="Identity & Contact Info" 
             subtitle="Your basic identity and contact details" 
             icon={User} 
           >
             <RightCardRow icon={User} label="Gender" value={gender} />
             <RightCardRow icon={Calendar} label="Date of Birth" value={fmtDate(dob)} />
             <RightCardRow icon={Phone} label="Phone Number" value={phone} />
             <RightCardRow icon={Mail} label="Email Address" value={email} />
             <RightCardRow icon={MapPin} label="Work Location" value={workLocation} />
           </SectionCard>

           <SectionCard 
             title="Statutory & Bank Info" 
             subtitle="Your official tax and banking records" 
             icon={Landmark} 
           >
             <RightCardRow icon={Shield} label="PF Number" value={pfNumber} />
             <RightCardRow icon={Shield} label="UAN Number" value={uan} />
             <RightCardRow icon={ShieldCheck} label="ESI Number" value={esi} />
             <RightCardRow icon={Building} label="Bank Name" value={bankName} />
             <RightCardRow icon={Landmark} label="Account Number" value={bank} />
             <RightCardRow icon={CreditCard} label="IFSC Code" value={ifscCode} />
           </SectionCard>

           <SectionCard 
             title="Current Address" 
             subtitle="Your current residential address" 
             icon={Home} 
           >
             <RightCardRow icon={MapPin} label="Address" value={address} />
           </SectionCard>

           <SectionCard 
             title="Salary Information" 
             subtitle="Your professional compensation details" 
             icon={CreditCard} 
           >
             <RightCardRow icon={CreditCard} label="Basic Salary" value={emp?.basicSalary || "—"} />
             <RightCardRow icon={CreditCard} label="HRA" value={emp?.hraAllowance || "—"} />
             <RightCardRow icon={CreditCard} label="DA" value={emp?.da || "—"} />
             <RightCardRow icon={CreditCard} label="Total Salary" value={emp?.totalSalary || "—"} />
           </SectionCard>

           <SectionCard 
             title="Emergency Contact" 
             subtitle="Your emergency contact details" 
             icon={PhoneCall} 
           >
             <RightCardRow 
               icon={PhoneCall} 
               label={emergencyName || "Contact Name"} 
               value={emergencyPhone ? `${emergencyPhone} ${emp?.emergencyRelation ? `(${emp.emergencyRelation})` : ""}` : "—"} 
             />
           </SectionCard>
        </div>
      </div>
    </div>
  );
};
