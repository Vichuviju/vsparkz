import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeListTable } from './EmployeeTable';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  CreditCard,
  ShieldCheck,
  FileText,
  Trash2,
  Edit2,
  ChevronLeft,
  X,
  CheckCircle2,
  Building2,
  UserCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";
import { useCreateEmployeeMutation, useUpdateEmployeeMutation, useGetEmployeeByIdQuery, useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { useGetShiftsQuery } from "@/services/hrms/shifts.api";
import { useGetRBACRolesQuery } from "@/services/rbac/rbac.api";
import { useLocation, useNavigate } from "react-router-dom";
import { getProfileImageUrl } from "@/services/base/base.api";
import { UserSearchSelect } from '@/components/userSelect/userSelect.jsx';
import { FUserSelect } from '@/components/userSelect/FuserSelect';
import { useGetAllUsersListQuery } from '@/services/user/user.api.js'
import { useInitiateTerminationMutation } from '@/services/hrms/termination.api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const FormSection = ({ title, children, icon: Icon }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <Icon className="w-5 h-5 text-blue-600" />
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// ------------------------------
// ZOD VALIDATION SCHEMA
// ------------------------------
const EmployeeSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dob: z.string().optional().or(z.literal("")),
  gender: z.string().min(1, "Gender is required"),
  
  roleId: z.coerce.string().min(1, "Role is required"),
  designation: z.string().optional(),
  doj: z.string().min(1, "Joining Date is required"),
  type: z.string().min(1, "Employment Type is required"),
  status: z.string().min(1, "Status is required"),
  departmentId: z.coerce.string().min(1, "Department is required"),
  shiftId: z.coerce.string().min(1, "Shift is required"),
  managerId: z.string().nullable().optional(),

  basicSalary: z.string().min(1, "Basic Salary is required"),
  da: z.string().optional().or(z.literal("")),
  hraAllowance: z.string().optional().or(z.literal("")),
  travelAllowance: z.string().optional().or(z.literal("")),
  specialAllowance: z.string().optional().or(z.literal("")),
  otherAllowance: z.string().optional().or(z.literal("")),
  totalSalary: z.coerce.number().optional(),

  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyRelation: z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),

  nationality: z.string().optional().or(z.literal("")),
  maritalStatus: z.string().optional().or(z.literal("")),
  passportNumber: z.string().optional().or(z.literal("")),
  workLocation: z.string().optional().or(z.literal("")),

  bankName: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  ifscCode: z.string().optional().or(z.literal("")),
  pfNumber: z.string().optional().or(z.literal("")),
  esiNumber: z.string().optional().or(z.literal("")),
});


const toDateInputValue = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

const formatRoleName = (str) => {
  if (!str) return "";
  return str
    .split(/_|\s/) // split by underscore or space
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};


export const AddNewEmployee = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const editingEmployeeFromState = location.state?.employee || null;
  const unlinkedUser = location.state?.unlinkedUser || null;
  const deptId = state?.deptId || null;

  // 🔹 Always fetch FULL profile if we are in Edit Mode
  const { data: fullEmployeeResponse, isFetching: isFullDataFetching } = useGetEmployeeByIdQuery(
    editingEmployeeFromState?.id || editingEmployeeFromState?.employeeId, 
    { skip: !editingEmployeeFromState }
  );

  const editingEmployee = fullEmployeeResponse?.data || fullEmployeeResponse || editingEmployeeFromState;
  // const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [view, setView] = useState("list");
  const isEditMode = !!editingEmployee;
  const { checkPermission, isLoading: rbacLoading } = useHRMSPermissions();
  const requiredPath = '/hrms/core';
  const requiredAction = isEditMode ? 'edit' : 'create';

  const hasPermission = checkPermission(requiredPath, requiredAction);
  
  useEffect(() => {
    // strict page-level guard: active redirection if user accesses via URL without permissions
    // We only redirect if permissions object is fully loaded and hasPermission is false
    if (rbacLoading) return;
    if (!hasPermission) {
       toast.error(`Access Denied. You lack permissions to ${requiredAction} personnel records.`);
       navigate('/dashboard', { replace: true });
    }
  }, [hasPermission, navigate, requiredAction, rbacLoading]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [profilePreview, setProfilePreview] = useState(getProfileImageUrl(editingEmployee?.profileImage));
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState(editingEmployee?.documents || []);
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const { data: allEmployees, isLoading: isAllEmployeesLoading } = useGetAllEmployeesQuery();
  const { data: allDepartments, isLoading: isDepartmentsLoading } = useGetAllDepartmentsQuery();
  const [userId, setUserId] = useState(null);
  const { data: shiftsData, isLoading: isShiftsLoading } = useGetShiftsQuery();
  const { data: rolesData, isLoading: isRolesLoading } = useGetRBACRolesQuery();
  const roles = rolesData?.data || [];
  const [employee, setEmployee] = useState({
    reportingManagerId: null,
    reportingManagerName: "",
  });

  const [initiateTermination] = useInitiateTerminationMutation();
  const [terminationDialog, setTerminationDialog] = useState({
    isOpen: false,
    formData: null,
    terminationDate: new Date().toISOString().split('T')[0],
    reason: ""
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading: isUsersLoading, isError, refetch } = useGetAllUsersListQuery({
    limit: 999999,
    search: debouncedSearch,
  });
  
  


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const users = data?.data?.users || [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: {
      firstName: editingEmployee?.firstName ?? unlinkedUser?.firstName ?? "",
      lastName: editingEmployee?.lastName ?? unlinkedUser?.lastName ?? "",
      email: editingEmployee?.email ?? unlinkedUser?.email ?? "",
      phone: editingEmployee?.phoneNumber ?? unlinkedUser?.phoneNumber ?? "",
      dob: toDateInputValue(editingEmployee?.dateOfBirth) ?? "",
      gender: editingEmployee?.gender || "",
      designation: editingEmployee?.designation ?? "",
      roleId: editingEmployee?.roleId ? String(editingEmployee.roleId) : (unlinkedUser?.roleId ? String(unlinkedUser.roleId) : "3"), 
      doj: toDateInputValue(editingEmployee?.joiningDate) ?? "",
      type: editingEmployee?.employmentType || "",
      status: editingEmployee?.status || "ACTIVE",
      emergencyContactName: editingEmployee?.emergencyName ?? "",
      emergencyRelation: editingEmployee?.emergencyRelation ?? "",
      emergencyContactPhone: editingEmployee?.emergencyPhone ?? "",
      bankName: editingEmployee?.bankName ?? "",
      accountNumber: editingEmployee?.accountNumber ?? "",
      ifscCode: editingEmployee?.ifscCode ?? "",
      pfNumber: editingEmployee?.pfNumber ?? "",
      esiNumber: editingEmployee?.esiNumber ?? "",
      departmentId: editingEmployee?.departmentId ? String(editingEmployee.departmentId) : (deptId || ""),
      shiftId: editingEmployee?.shiftId ? String(editingEmployee.shiftId) : "",
      managerId: editingEmployee?.reportingManagerId ?? null,
      nationality: editingEmployee?.nationality ?? "",
      maritalStatus: editingEmployee?.maritalStatus ?? "",
      passportNumber: editingEmployee?.passportNumber ?? "",
      workLocation: editingEmployee?.workLocation ?? "",
      basicSalary: editingEmployee?.basicSalary ?? "",
      da: editingEmployee?.da ?? "",
      hraAllowance: editingEmployee?.hraAllowance ?? "",
      travelAllowance: editingEmployee?.travelAllowance ?? "",
      specialAllowance: editingEmployee?.specialAllowance ?? "",
      otherAllowance: editingEmployee?.otherAllowance ?? "",
      totalSalary: editingEmployee?.totalSalary ?? 0,
    },
  });

  // Ensure form is updated when editingEmployee or unlinkedUser data is loaded/changed
  useEffect(() => {
    if (editingEmployee) {
      reset({
        firstName: editingEmployee?.firstName ?? "",
        lastName: editingEmployee?.lastName ?? "",
        email: editingEmployee?.email ?? "",
        phone: editingEmployee?.phoneNumber ?? "",
        dob: toDateInputValue(editingEmployee?.dateOfBirth) ?? "",
        gender: editingEmployee?.gender || "",
        designation: editingEmployee?.designation ?? "",
        roleId: editingEmployee?.roleId ? String(editingEmployee.roleId) : "3",
        doj: toDateInputValue(editingEmployee?.joiningDate) ?? "",
        type: editingEmployee?.employmentType || "",
        status: editingEmployee?.status || "",
        emergencyContactName: editingEmployee?.emergencyName ?? "",
        emergencyRelation: editingEmployee?.emergencyRelation ?? "",
        emergencyContactPhone: editingEmployee?.emergencyPhone ?? "",
        nationality: editingEmployee?.nationality ?? "",
        maritalStatus: editingEmployee?.maritalStatus ?? "",
        passportNumber: editingEmployee?.passportNumber ?? "",
        workLocation: editingEmployee?.workLocation ?? "",
        bankName: editingEmployee?.bankName ?? "",
        accountNumber: editingEmployee?.accountNumber ?? "",
        ifscCode: editingEmployee?.ifscCode ?? "",
        pfNumber: editingEmployee?.pfNumber ?? "",
        esiNumber: editingEmployee?.esiNumber ?? "",
        departmentId: editingEmployee?.departmentId ? String(editingEmployee.departmentId) : (deptId || ""),
        shiftId: editingEmployee?.shiftId ? String(editingEmployee.shiftId) : "",
        managerId: editingEmployee?.reportingManagerId ?? null,
        basicSalary: editingEmployee?.basicSalary ?? "",
        da: editingEmployee?.da ?? "",
        hraAllowance: editingEmployee?.hraAllowance ?? "",
        travelAllowance: editingEmployee?.travelAllowance ?? "",
        specialAllowance: editingEmployee?.specialAllowance ?? "",
        otherAllowance: editingEmployee?.otherAllowance ?? "",
        totalSalary: editingEmployee?.totalSalary ?? 0,
      });
    } else if (unlinkedUser) {
      reset({
        firstName: unlinkedUser?.firstName ?? "",
        lastName: unlinkedUser?.lastName ?? "",
        email: unlinkedUser?.email ?? "",
        phone: unlinkedUser?.phoneNumber ?? "",
        dob: "",
        gender: "",
        designation: "",
        roleId: unlinkedUser?.roleId ? String(unlinkedUser.roleId) : "3",
        doj: "",
        type: "",
        status: "ACTIVE",
        emergencyContactName: "",
        emergencyRelation: "",
        emergencyContactPhone: "",
        nationality: "",
        maritalStatus: "",
        passportNumber: "",
        workLocation: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        pfNumber: "",
        esiNumber: "",
        departmentId: deptId || "",
        shiftId: "",
        managerId: null,
        basicSalary: "",
        da: "",
        hraAllowance: "",
        travelAllowance: "",
        specialAllowance: "",
        otherAllowance: "",
        totalSalary: 0,
      });
    }
  }, [editingEmployee, unlinkedUser, reset, deptId]);

  const basic = watch("basicSalary");
  const da = watch("da");
  const hra = watch("hraAllowance");
  const travel = watch("travelAllowance");
  const special = watch("specialAllowance");
  const other = watch("otherAllowance");
  const totalSalary = watch("totalSalary");
  const roleIdFromWatch = watch("roleId");
  const departmentId = watch("departmentId");
  
  const selectedRole = useMemo(() => {
    return roles.find(r => String(r.id) === String(roleIdFromWatch));
  }, [roles, roleIdFromWatch]);
 
  const idPreview = useMemo(() => {
    if (editingEmployee) return editingEmployee.empCode;
    if (!selectedRole || !departmentId) return "AUTO-GENERATED";
 
    const desPrefix = (selectedRole.name || "EX").slice(0, 2).toUpperCase();
    const dept = allDepartments?.data?.find(d => String(d.id) === String(departmentId));
    const deptPrefix = (dept?.name || "??").slice(0, 2).toUpperCase();
    const nextNum = (allEmployees?.data?.length || 0) + 1;
    return `${desPrefix}${deptPrefix}${nextNum.toString().padStart(3, "0")}`;
  }, [selectedRole, departmentId, allEmployees, allDepartments, editingEmployee]);

  // LOG VALIDATION ERRORS DEBUGGING
  useEffect(() => {
    if (Object.keys(errors).length > 0) {

    }
  }, [errors]);

  const onSubmit = async (formData) => {
    const payload = {
      user: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        roleId: Number(formData.roleId),
        id: editingEmployee ? editingEmployee.userId : (unlinkedUser ? unlinkedUser.id : null),
      },
      employee: {
        userId: editingEmployee ? editingEmployee.userId : (unlinkedUser ? unlinkedUser.id : null),
        reportingManagerId: formData.managerId,
        dateOfBirth: formData.dob,
        gender: formData.gender,
        designation: formatRoleName(selectedRole?.name) || "",
        joiningDate: formData.doj,
        employmentType: formData.type,
        departmentId: deptId || formData?.departmentId || "",
        shiftId: Number(formData.shiftId),
        status: formData.status,
        emergencyName: formData.emergencyContactName,
        emergencyRelation: formData.emergencyRelation,
        emergencyPhone: formData.emergencyContactPhone,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        pfNumber: formData.pfNumber,
        esiNumber: formData.esiNumber,
        nationality: formData.nationality,
        maritalStatus: formData.maritalStatus,
        passportNumber: formData.passportNumber,
        workLocation: formData.workLocation,
        // basic_salary: formData.salary,
        // accommodationAllowance: formData.accommodation,
        // transportationAllowance: formData.transportation,
         basicSalary: formData?.basicSalary ?? "",
        da: formData?.da ?? "",
        hraAllowance: formData?.hraAllowance ?? "",
        travelAllowance: formData?.travelAllowance ?? "",
        specialAllowance: formData?.specialAllowance ?? "",
        otherAllowance: formData?.otherAllowance ?? "",
         totalSalary: formData?.totalSalary ?? "",
        documents: existingDocuments,
      },
    };

    const formDataToSend = new FormData();
    formDataToSend.append("data", JSON.stringify(payload));
    if (selectedFile) {
      formDataToSend.append("profileImage", selectedFile);
    }
    selectedDocuments.forEach(file => {
      formDataToSend.append("documents", file);
    });

    try {
      if (editingEmployee) {
        const isStatusChange = editingEmployee.status?.toUpperCase() !== formData.status?.toUpperCase();
        
        const currentStatus = editingEmployee.status?.toUpperCase();
        const targetStatus = formData.status?.toUpperCase();

        const isTermination = (targetStatus === "RESIGNED" || targetStatus === "TERMINATED") && 
                             isStatusChange;
        
        const isReactivation = (currentStatus === "RESIGNED" || currentStatus === "TERMINATED") && 
                              isStatusChange &&
                              targetStatus !== "RESIGNED" && targetStatus !== "TERMINATED";

        if (isTermination || isReactivation) {
          setTerminationDialog({
            ...terminationDialog,
            isOpen: true,
            formData: formDataToSend
          });
          return; // Stop normal update
        }

        await updateEmployee({
          id: editingEmployee.id || editingEmployee.employeeId,
          payload: formDataToSend,
        }).unwrap();
        toast.success("Personnel profile updated successfully!");
      } else {
        await createEmployee(formDataToSend).unwrap();
        toast.success("New personnel record registered successfully!");
      }

      navigate(-1);
    } catch (err) {
      
      const errorMessage = err?.data?.message || "Failed to save personnel record. Please verify all fields.";
      toast.error(errorMessage);
    }
  };

  const onValidationError = (errors) => {
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      toast.error(`Missing Information: ${errorMessages[0].message}`);
    }
  };

  // useEffect(() => {
  //   const total = Number(totalSalary);

  //   if (!total || total <= 0) {
  //     setValue("basicSalary", "");
  //     setValue("accommodation", "");
  //     setValue("transportation", "");
  //     return;
  //   }

  //   setValue("basicSalary", (total * 0.6).toFixed(2));
  //   setValue("accommodation", (total * 0.25).toFixed(2));
  //   setValue("transportation", (total * 0.15).toFixed(2));
  // }, [totalSalary]);

  useEffect(() => {
  const total =
    (Number(basic) || 0) +
    (Number(da) || 0) +
    (Number(hra) || 0) +
    (Number(travel) || 0) +
    (Number(special) || 0) +
    (Number(other) || 0);

  setValue("totalSalary", total);
}, [basic, da, hra, travel, special, other, setValue]);

  const handleTerminationSubmit = async () => {
    if (!terminationDialog.reason.trim()) {
      return toast.error("Please provide a reason for the exit.");
    }

    try {
      await initiateTermination({
        employeeId: editingEmployee.id || editingEmployee.employeeId,
        terminationDate: terminationDialog.terminationDate,
        reason: terminationDialog.reason,
        status: watch("status") // Pass the selected status (Resigned/Terminated)
      }).unwrap();

      toast.success("Exit workflow initiated. Pending approval.");
      setTerminationDialog({ ...terminationDialog, isOpen: false });
      navigate(-1);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to initiate exit workflow.");
    }
  };

  // Loading state check - placed AFTER all hooks to satisfy Rules of Hooks
  if (editingEmployeeFromState && isFullDataFetching && !fullEmployeeResponse) {
    return (
        <div className=" bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading complete profile data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 text-gray-900 font-sans pb-20 [color-scheme:light]">
      <Dialog 
        open={terminationDialog.isOpen} 
        onOpenChange={(open) => setTerminationDialog({ ...terminationDialog, isOpen: open })}
      >
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {["Resigned", "Terminated"].includes(watch("status")) ? "Initiate Exit Workflow" : "Initiate Status Change Workflow"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium">
              Changing status to <span className="text-blue-600 font-bold">{watch("status")}</span> requires management approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Last Working Day (LWD)</Label>
              <Input 
                type="date" 
                value={terminationDialog.terminationDate}
                onChange={(e) => setTerminationDialog({ ...terminationDialog, terminationDate: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Reason for Exit</Label>
              <textarea 
                placeholder="Briefly describe the reason for resignation or termination..."
                value={terminationDialog.reason}
                onChange={(e) => setTerminationDialog({ ...terminationDialog, reason: e.target.value })}
                className="w-full min-h-[100px] p-4 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setTerminationDialog({ ...terminationDialog, isOpen: false })}
              className="font-bold text-slate-500 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTerminationSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 shadow-lg shadow-blue-100"
            >
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-xl shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2 mt-1">
                  <nav className="flex text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Directory</span>
                    <ChevronRight className="w-3 h-3 mx-1" />
                    <span className="text-blue-600">Employee Master</span>
                  </nav>
                  {editingEmployee && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        ID: {editingEmployee.empCode}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                className="font-bold text-gray-500 rounded-xl"
              >
                Discard
              </Button>

              <Button
                type="submit"
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {editingEmployee ? 'Save Changes' : 'Confirm Entry'}
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center mb-10 group">
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-8 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center ring-1 ring-gray-100 transition-all group-hover:ring-blue-100">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                    <UserCircle className="w-24 h-24 text-blue-200" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-1 right-1 p-3 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-xl transition-all hover:scale-110 active:scale-95 border-4 border-white">
                <Edit2 className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      setProfilePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 font-black uppercase tracking-[0.2em]">Deployment Identity Photograph</p>
          </div>

          <div className="space-y-6">
            <FormSection title="Personal Information" icon={UserCircle}>
              <div>
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input {...register("firstName")} className={errors.firstName ? "border-red-500 bg-red-50" : ""} />
                {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input {...register("lastName")} className={errors.lastName ? "border-red-500 bg-red-50" : ""} />
                {errors.lastName && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.lastName.message}</p>}
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" {...register("dob")} />
              </div>
              <div>
                <Label>Work Email <span className="text-red-500">*</span></Label>
                <Input type="email" {...register("email")} className={errors.email ? "border-red-500 bg-red-50" : ""} />
                {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.email.message}</p>}
              </div>
              <div>
                <Label>Phone Number <span className="text-red-500">*</span></Label>
                <Input {...register("phone")} className={errors.phone ? "border-red-500 bg-red-50" : ""} />
                {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.phone.message}</p>}
              </div>
              <div>
                <Label>Gender Identity <span className="text-red-500">*</span></Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className={`text-slate-900 font-medium ${errors.gender ? "border-red-500 bg-red-50" : ""}`}>
                        <SelectValue placeholder="Select gender">
                          <span className="text-slate-900">{field.value || "Select gender"}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {["Male", "Female", "Other"].map(g => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.gender.message}</p>}
              </div>

              <div>
                <Label>Emergency Contact Person</Label>
                <Input {...register("emergencyContactName")} placeholder="Guardian/Name" />
              </div>
              <div>
                <Label>Relationship</Label>
                <Input {...register("emergencyRelation")} placeholder="e.g. Spouse, Father" />
              </div>
              <div>
                <Label>Emergency Phone No.</Label>
                <Input {...register("emergencyContactPhone")} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <Label>Nationality</Label>
                <Input {...register("nationality")} placeholder="e.g. Indian" />
              </div>
              <div>
                <Label>Passport / ID No.</Label>
                <Input {...register("passportNumber")} placeholder="Enter passport or ID" />
              </div>
              <div>
                <Label>Marital Status</Label>
                <Controller
                  name="maritalStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="text-slate-900 font-medium">
                        <SelectValue placeholder="Select status">
                          <span className="text-slate-900">{field.value || "Select status"}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {["Single", "Married", "Divorced", "Widowed"].map(s => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </FormSection>
            <FormSection title="Organization Details" icon={Briefcase}>
              <div>
                <Label>Role / Designation <span className="text-red-500">*</span></Label>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className={`text-slate-900 font-medium ${errors.roleId ? "border-red-500 bg-red-50" : ""}`}>
                        <SelectValue placeholder="Select Role">
                          <span className="text-slate-900">
                             {selectedRole ? formatRoleName(selectedRole.name) : (editingEmployee?.designation || "Select Role")}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {formatRoleName(role.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.roleId && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.roleId.message}</p>}
              </div>
              <div>
                <Label>Employee Code {editingEmployee ? "" : "(Preview)"}</Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-blue-50/50 px-3 py-2 text-sm text-blue-700 font-black tracking-widest ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  {idPreview}
                </div>
                <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Auto-calculated based on record parameters</p>
              </div>
              {/* <div>
                <Label>Reporting Manager</Label>
                <Input {...register("manager")} />
              </div> */}
              <div>
                <Label>Joining Date <span className="text-red-500">*</span></Label>
                <Input type="date" {...register("doj")} className={errors.doj ? "border-red-500 bg-red-50" : ""} />
                {errors.doj && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.doj.message}</p>}
              </div>
              <div>
                <Label>Employment Type <span className="text-red-500">*</span></Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className={`text-slate-900 font-medium ${errors.type ? "border-red-500 bg-red-50" : ""}`}>
                        <SelectValue placeholder="Select employment type">
                          {field.value || "Select employment type"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {["Permanent", "Contract"].map(t => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.type.message}</p>}
              </div>
              <div>
                <Label>Employment Status <span className="text-red-500">*</span></Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className={`text-slate-900 font-medium ${errors.status ? "border-red-500 bg-red-50" : ""}`}>
                        <SelectValue placeholder="Select status">
                          {field.value || "Select status"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {["Active", "Notice Period", "Resigned", "Terminated"].map(s => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.status.message}</p>}
              </div>
              <div>
                <Label>Department <span className="text-red-500">*</span></Label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className={`text-slate-900 font-medium ${errors.departmentId ? "border-red-500 bg-red-50" : ""}`}>
                        <SelectValue placeholder="Select department">
                          {allDepartments?.data?.find(d => String(d.id) === String(field.value))?.name || "Select department"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {allDepartments?.data?.map(dept => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.departmentId && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.departmentId.message}</p>}
              </div>
              <div>
                <Label>Work Shift <span className="text-red-500">*</span></Label>
                <Controller
                  name="shiftId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className={`text-slate-900 font-medium ${errors.shiftId ? "border-red-500 bg-red-50" : ""}`}>
                        <SelectValue placeholder="Select shift pattern">
                          {shiftsData?.data?.find(s => String(s.id) === String(field.value))?.shiftName || "Select shift pattern"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {shiftsData?.data?.map(shift => (
                          <SelectItem key={shift.id} value={String(shift.id)}>
                            {shift.shiftName} ({shift.firstPunch} - {shift.lastPunch})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.shiftId && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.shiftId.message}</p>}
              </div>
              <div>
                <Label>Reporting Manager</Label>

              <Controller
  name="managerId"
  control={control}
  render={({ field }) => {
    const selectedUser = users?.find(
      (user) => String(user.id) === String(field.value)
    );

    return (
      <Combobox
        items={users}
        value={selectedUser || null}   // ✅ VERY IMPORTANT
        itemToStringLabel={(item) =>
          item ? `${item.firstName} ${item.lastName}` : ""
        }
        onValueChange={(item) => {
          const newId = item?.id || null;
          if (field.value !== newId) {
            field.onChange(newId); // ✅ safely store only ID
          }
        }}
      >
        <ComboboxInput placeholder="Select Manager" />

        <ComboboxContent>
          <ComboboxEmpty>No users found.</ComboboxEmpty>

          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                {item.firstName} {item.lastName}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  }}
/>


              </div>
              <div>
                <Label>Work Location</Label>
                <Input {...register("workLocation")} placeholder="e.g. Head Office" />
              </div>
            </FormSection>

            {/* <FormSection title="Salary Info" icon={CreditCard}>
              <div>
                <Label>Total Salary *</Label>
                <Input
                  type="number"
                  {...register("totalSalary", { required: true })}
                  placeholder="Enter total salary"
                />
              </div>

              <div>
                <Label>Basic Salary</Label>
                <Input
                  type="number"
                  {...register("basicSalary")}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated (60%)
                </p>
              </div>

              <div>
                <Label>Accommodation *</Label>
                <Input
                  type="number"
                  {...register("accommodation")}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated (25%)
                </p>
              </div>

              <div>
                <Label>Transportation *</Label>
                <Input
                  type="number"
                  {...register("transportation")}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated (15%)
                </p>
              </div>
            </FormSection> */}

            <FormSection title="Salary Info" icon={CreditCard}>
  <div>
    <Label>Basic Salary <span className="text-red-500">*</span></Label>
    <Input
      type="number"
      {...register("basicSalary")}
      placeholder="Enter basic salary"
      className={errors.basicSalary ? "border-red-500 bg-red-50" : ""}
    />
    {errors.basicSalary && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.basicSalary.message}</p>}
  </div>

  <div>
    <Label>DA (Dearness Allowance)</Label>
    <Input
      type="number"
      {...register("da")}
      placeholder="Enter DA"
    />
  </div>

  <div>
    <Label>HRA (House Rent Allowance)</Label>
    <Input
      type="number"
      {...register("hraAllowance")}
      placeholder="Enter HRA"
    />
  </div>

  <div>
    <Label>Travel Allowance</Label>
    <Input
      type="number"
      {...register("travelAllowance")}
      placeholder="Enter travel allowance"
    />
  </div>

  <div>
    <Label>Special Allowance</Label>
    <Input
      type="number"
      {...register("specialAllowance")}
      placeholder="Enter special allowance"
    />
  </div>

  <div>
    <Label>Other Allowances</Label>
    <Input
      type="number"
      {...register("otherAllowance")}
      placeholder="Enter other allowances"
    />
  </div>

  <div>
    <Label>Total Salary *</Label>
    <Input
      type="number"
      {...register("totalSalary")}
      readOnly
    />
    <p className="text-xs text-gray-500 mt-1">
      Auto-calculated from all components
    </p>
  </div>
</FormSection>




            <FormSection title="Financial & Statutory" icon={CreditCard}>
              <Input {...register("bankName")} placeholder="Bank Name" />
              <Input {...register("accountNumber")} placeholder="Account Number" />
              <Input {...register("ifscCode")} placeholder="IFSC Code" />
              <Input {...register("pfNumber")} placeholder="PF No" />
              <Input {...register("esiNumber")} placeholder="ESI No" />
              {/* <Input type="number" {...register("salary")} placeholder="Annual CTC" /> */}
            </FormSection>

            <FormSection title="Supporting Documents" icon={FileText}>
              <div className="col-span-full">
                <label className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer flex flex-col items-center justify-center">
                  <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="text-blue-600 w-7 h-7" />
                  </div>
                  <h4 className="text-gray-900 font-bold">Upload Verification Files</h4>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto italic">
                    Drag and drop passport, education certificates, or contract scans here.
                  </p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setSelectedDocuments(prev => [...prev, ...files]);
                    }}
                  />
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                    Select Multiple Files
                  </div>
                </label>

                {/* Display Newly Selected Documents */}
                {selectedDocuments.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Selected for Upload</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedDocuments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 truncate">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDocuments(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display Existing Documents */}
                {existingDocuments.length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Previously Uploaded Documents</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {existingDocuments.map((path, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl group/existing">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 truncate">
                              {path.split("/").pop()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={getProfileImageUrl(path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setExistingDocuments(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        </form>
      </main>
    </div>
  );
};