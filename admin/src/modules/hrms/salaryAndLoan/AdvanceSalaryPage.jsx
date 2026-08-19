import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { AdvanceSalaryCard } from "./AdvanceSalaryCard"
import { AdvanceSalaryTable } from "./AdvanceSalaryTable"
import { Plus } from "lucide-react"
import { RequestAdvanceSalaryModal } from "@/components/modals/hrms/salaryAndLoan/RequestAdvanceSalaryModal"
import { toast } from "sonner"
import { HrApprovalModal } from "@/components/modals/hrms/salaryAndLoan/HrApprovalModal"
import { RejectLoanModal } from "@/components/modals/hrms/salaryAndLoan/RejectLoanModal"
import { useGetAllAdvanceSalaryQuery,useGetMyAdvanceSalaryQuery, useUpdateAdvanceSalaryStatusMutation, useUpdateAdvanceSalaryMutation, useDeleteAdvanceSalaryMutation} from "@/services/hrms/advanceSalary.api"

export const AdvanceSalaryPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateAdvanceSalaryStatus] = useUpdateAdvanceSalaryStatusMutation();
  const [selectedAdvance, setSelectedAdvance] = useState(null)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  const [updateAdvanceSalary] = useUpdateAdvanceSalaryMutation()
  const [deleteAdvanceSalary] = useDeleteAdvanceSalaryMutation()

  const handleDelete = async (data) => {
  try {
    await deleteAdvanceSalary(data.id).unwrap()
    toast.success("Advance Salary Deleted")
  } catch (err) {
    toast.error("Delete failed")
  }
}

const handleEdit = (data) => {
  setEditData(data)
  setIsModalOpen(true)
}

  const role = "admin"

  const { data: allData } = useGetAllAdvanceSalaryQuery(undefined, {
    skip: role !== "admin",
  })

  const { data: myData } = useGetMyAdvanceSalaryQuery(undefined, {
    skip: role !== "employee",
  })

const advanceData =
  role === "admin" ? allData?.data ?? [] : myData?.data ?? []

  const pendingRequests = advanceData.filter(
  (item) => item.status === "submitted"
)

const handleApprove = (data) => {
  setSelectedAdvance(data)
  setApproveOpen(true)
}

const handleReject = (data) => {
  setSelectedAdvance(data)
  setRejectOpen(true)
}

const handleApproveSubmit = async ({ id, remarks }) => {
  try {
    await updateAdvanceSalaryStatus({
      id,
      status: "hr_approved",
      remarks,
    }).unwrap()

    toast.success("Advance Salary Approved")
    setApproveOpen(false)
  } catch (error) {
    toast.error("Failed to approve")
  }
}

const handleRejectSubmit = async ({ id, rejectionReason }) => {
  try {
    await updateAdvanceSalaryStatus({
      id,
      status: "rejected",
      rejectionReason,
    }).unwrap()

    toast.success("Advance Salary Rejected")
    setRejectOpen(false)
  } catch (error) {
    toast.error("Failed to reject")
  }
}


const historyData = advanceData

// const handleApprove = async (data) => {
//   try {
//     await updateAdvanceSalaryStatus({
//       id: data.id,
//       status: "hr_approved",
//     }).unwrap()

//     toast.success("Advance Salary Approved")
//   } catch (error) {
//     toast.error("Failed to approve")
//   }
// }

// const handleReject = async (data) => {
//   try {
//     await updateAdvanceSalaryStatus({
//       id: data.id,
//       status: "rejected",
//     }).unwrap()

//     toast.success("Advance Salary Rejected")
//   } catch (error) {
//     toast.error("Failed to reject")
//   }
// }

  return (
    <div className="p-6 space-y-8">

      <div className="flex items-center justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Request Advance Salary
        </Button>
      </div>

      {/* Pending Cards Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Pending Approvals</h2>
          <span className="bg-amber-100 text-amber-600 text-xs px-2 py-1 rounded-full">
            {pendingRequests.length}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {pendingRequests.map((item) => (
            <AdvanceSalaryCard key={item.id} data={item} onApprove={handleApprove} onReject={handleReject}/>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div>
        <AdvanceSalaryTable
          data={historyData}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal Placeholder */}
      {isModalOpen && (
        <div>
          {/* 🔥 Add your Advance Salary Modal Component Here */}
          <RequestAdvanceSalaryModal
            open={isModalOpen}
            setOpen={(val)=>{
              setIsModalOpen(val)
              if(!val) setEditData(null)
            }}
            initialData={editData}
          />
        </div>
      )}

      {/* HR Approve Modal */}
      <HrApprovalModal
        open={approveOpen}
        setOpen={setApproveOpen}
        data={selectedAdvance}
        onApprove={handleApproveSubmit}
      />

      {/* Reject Modal */}
      <RejectLoanModal
        open={rejectOpen}
        setOpen={setRejectOpen}
        data={selectedAdvance}
        onReject={handleRejectSubmit}
      />
    </div>
  )
}