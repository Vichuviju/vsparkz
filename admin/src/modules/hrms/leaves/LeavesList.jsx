"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ApplyLeaveModal } from "@/components/modals/hrms/leaves/ApplyLeaveModal"
import { LeavesListTable } from "./LeavesListTable"
import { useGetMyLeavesQuery, useDeleteLeaveMutation, useGetAllLeavesQuery, useGetMyLeaveBalanceQuery } from "@/services/hrms/leaves.api.js"
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LeaveBalanceCards = ({ balances }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {balances.map((item) => (
        <div
          key={item.type}
          className="bg-white shadow rounded-lg p-4 border"
        >
          <h3 className="text-lg font-semibold">{item.type}</h3>

          <div className="mt-2 space-y-1 text-sm">
            <p>Total: {item.allocated}</p>
            <p>Used: {item.used}</p>
            <p className="text-green-600 font-medium">
              Remaining: {item.remaining}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}


export const LeaveListPage = () => {
  const [open, setOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [deleteLeave] = useDeleteLeaveMutation()

  const isAdmin = true;

const { data: myLeavesData, isLoading: myLoading } =
  useGetMyLeavesQuery(
    { page: 1, limit: 10 },
    { skip: isAdmin }
  );

const { data: allLeavesData, isLoading: allLoading } =
  useGetAllLeavesQuery(
    { page: 1, limit: 10 },
    { skip: !isAdmin }
  );

  const { data: balanceData, isLoading: balanceLoading } =
  useGetMyLeaveBalanceQuery();

  const balances = balanceData?.data || [];


const data = isAdmin ? allLeavesData : myLeavesData;
const isLoading = isAdmin ? allLoading : myLoading;

const leaves = data?.data || [];


  const handleEdit = (leave) => {
    if (leave.status !== "PENDING") return
    setSelectedLeave(leave)
    setOpen(true)
  }

 const handleDelete = async (leave) => {
  if (leave.status !== "PENDING") return
  setDeleteCandidate(leave);
}


  return (
    <div className="p-6">

      <div className="flex justify-end items-center mb-6">
        <Button
          onClick={() => {
            setSelectedLeave(null)
            setOpen(true)
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Leaves
        </Button>
      </div>

      {!balanceLoading && <LeaveBalanceCards balances={balances} />}


      <div className="bg-white rounded-lg shadow p-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
            <LeavesListTable
            leaves={leaves}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
        )}
      </div>

      <ApplyLeaveModal
        open={open}
        setOpen={setOpen}
        initialData={selectedLeave}
      />

      <Dialog open={!!deleteCandidate} onOpenChange={(openState) => !openState && setDeleteCandidate(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Leave Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this leave request?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await deleteLeave(deleteCandidate.id).unwrap();
                  toast.success("Leave deleted successfully");
                  setDeleteCandidate(null);
                } catch (err) {
                  toast.error("Failed to delete leave");
                  
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

