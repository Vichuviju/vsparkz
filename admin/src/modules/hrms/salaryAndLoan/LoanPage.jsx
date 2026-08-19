import React, { useState, useMemo, useEffect} from "react"
import { Button } from "@/components/ui/button"
import { LoanRequestCard } from "./LoanRequestCard"
import { LoanHistoryTable } from "./LoanHistoryTable"
import { Plus } from "lucide-react"
import { LoanRequestModal } from "@/components/modals/hrms/salaryAndLoan/LoanRequestModal"
import {
  useGetAllLoansQuery, useGetMyLoansQuery, useDeleteLoanMutation, useUpdateLoanStatusMutation
} from "@/services/hrms/loan.api.js"
import { toast } from "sonner"
import { HrApprovalModal } from "@/components/modals/hrms/salaryAndLoan/HrApprovalModal"
import { RejectLoanModal } from "@/components/modals/hrms/salaryAndLoan/RejectLoanModal"


export const LoanPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [deleteLoan] = useDeleteLoanMutation();
  const [updateLoanStatus] = useUpdateLoanStatusMutation();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const role = "admin";
 const { data: allLoans = [], isLoading: allLoading } =
    useGetAllLoansQuery(
      { page: 1, limit: 10 },
      { skip: role !== "admin" }
    )

  const { data: myLoans = [], isLoading: myLoading } =
    useGetMyLoansQuery(undefined, {
      skip: role !== "employee",
    })

    const pendingLoans =
  role === "admin"
    ? (allLoans?.data ?? []).filter(
        (loan) => loan.status === "submitted"
      )
    : [];


const historyLoans =
  role === "admin"
    ? (allLoans?.data ?? [])
    : (myLoans?.data ?? [])

        const handleApprove = (loan) => {
  setSelectedLoan(loan)
  setApproveOpen(true)
}

const handleReject = (loan) => {
  setSelectedLoan(loan)
  setRejectOpen(true)
}

const handleApproveSubmit = async ({ id, deductionDate, remarks, paymentMode }) => {
  try {
    await updateLoanStatus({
      id,
      status: "hr_approved",
      deductionDate,
      remarks,
      paymentMode
    }).unwrap()

    toast.success("Loan approved successfully")
    setApproveOpen(false)
  } catch (error) {
    toast.error("Failed to approve loan")
  }
}

const handleRejectSubmit = async ({ id, rejectionReason }) => {
  try {
    await updateLoanStatus({
      id,
      status: "rejected",
      rejectionReason,
    }).unwrap()

    toast.success("Loan rejected successfully")
    setRejectOpen(false)
  } catch (error) {
    toast.error("Failed to reject loan")
  }
}

const handleProcess = async (loan) => {
  try {
    await updateLoanStatus({
      id: loan.id,
      status: "finance_processing",
    }).unwrap()

    toast.success("Loan moved to finance")
  } catch (error) {
    toast.error("Failed to process loan")
  }
}


const formatStatus = (status) => {
  const map = {
    submitted: "Pending",
    hr_approved: "HR Approved",
    manager_approved: "Manager Approved",
    rejected: "Rejected",
  }

  return map[status] || status
}

const mapStage = (status) => {
  const map = {
    submitted: "submitted",
    hr_approved: "hr",
    finance_processing: "finance",
    approved: "finance",
    rejected: "submitted",
  }

  return map[status] || "submitted"
}

const formattedPendingLoans = useMemo(() => {
  return pendingLoans.map((loan) => ({
    id: loan.loanId,

    employeeName: `${loan.firstName ?? ""} ${loan.lastName ?? ""}`,

    role: loan.designation ?? "Employee",

    avatar: `https://ui-avatars.com/api/?name=${loan.firstName}+${loan.lastName}`,

    loanName: loan.loanName ?? loan.loanType.replace("_", " "),

    amount: Number(loan.amount),

    currency: loan.currency,

    installments: loan.installments,

    reason: loan.reason || "No reason provided",

    date: loan.createdAt,

    stage: mapStage(loan.status),
  }))
}, [pendingLoans])

const formattedHistoryLoans = historyLoans.map((loan) => ({
  id: loan.loanId,

  employeeName: `${loan.firstName ?? ""} ${loan.lastName ?? ""}`,

  date: loan.createdAt,

  amount: Number(loan.amount),

  currency: loan.currency,

  installments: loan.installments,

  remaining: loan.installments, // adjust later when EMI logic added

  loanType: loan.loanType,

  loanName: loan.loanName ?? "-",

  reason: loan.reason ?? "-",

  status: formatStatus(loan.status),
}))

useEffect(() => {
  if (!openModal) {
    setSelectedLoan(null)
  }
}, [openModal])

  if (allLoading || myLoading) {
  return <div>Loading...</div>
}
  return (
    <div className="p-6 space-y-10">

      <div className="flex items-center justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setOpenModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Loan
        </Button>
      </div>

      {/* ================= LOAN REQUEST CARDS ================= */}
       {/* {role === "admin" && ( */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {formattedPendingLoans.map((loan) => (
          <LoanRequestCard
            key={loan.id}
            data={loan}
            onView={(data) => {}}
            onApprove={handleApprove}
            onProcess={handleProcess}
            onReject={handleReject}
          />
        ))}
      </div>
      {/* )} */}

      {/* ================= LOAN HISTORY TABLE ================= */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Loan History
        </h2>
        <LoanHistoryTable
          loans={formattedHistoryLoans ?? []}
          onView={(loan) => {}}
          onEdit={(loan) => {
            setSelectedLoan(loan)
            setOpenModal(true)
          }}
          onDelete={async (loan) => {
            try {
              await deleteLoan(loan.id).unwrap()
              toast.success("Loan deleted successfully")
            } catch (error) {
              toast.error("Failed to delete loan")
            }
          }}
        />
      </div>

      {/* ================= MODAL ================= */}
      
      <LoanRequestModal
        open={openModal}
        setOpen={setOpenModal}
        initialData={selectedLoan}  
      />
      <HrApprovalModal
        open={approveOpen}
        setOpen={setApproveOpen}
        data={selectedLoan}
        onApprove={handleApproveSubmit}
      />

      <RejectLoanModal
        open={rejectOpen}
        setOpen={setRejectOpen}
        data={selectedLoan}
        onReject={handleRejectSubmit}
      />
     
    </div>
  )
}