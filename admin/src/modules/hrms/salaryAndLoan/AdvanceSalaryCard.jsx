import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGetAllAdvanceSalaryQuery,useGetMyAdvanceSalaryQuery } from "@/services/hrms/advanceSalary.api"

export const AdvanceSalaryCard = ({ data, onApprove, onReject }) => {
  const {
    employeeName,
    firstName,
    lastName,
    avatar,
    type,
    amount,
    currency,
    requestMonth,
    stage,
  } = data

  const Step = ({ label, active }) => (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          active ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <span className={active ? "text-green-600" : "text-gray-400"}>
        {label}
      </span>
    </div>
  )

  return (
    <Card className="rounded-2xl shadow-sm border bg-white">
      <CardContent className="p-6 space-y-5">

        {/* Progress */}
        <div className="flex items-center justify-between">
          <Step label="Submitted" active />
          <div className="flex-1 h-[1px] bg-gray-200 mx-2" />
          <Step label="HR" active={stage !== "submitted"} />
          <div className="flex-1 h-[1px] bg-gray-200 mx-2" />
          <Step label="Finance" active={stage === "finance"} />
        </div>

        {/* Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={avatar}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{firstName + " " + lastName}</p>
              <p className="text-sm text-gray-500">{type}</p>
            </div>
          </div>

          <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium">
            Pending
          </span>
        </div>

        {/* Amount */}
        <div>
          <p className="text-xl font-bold">
            {currency} {amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            REQUEST MONTH
          </p>
          <p className="text-sm font-medium">{requestMonth}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => onApprove(data)}
          >
            HR Approve
          </Button>

          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => onReject(data)}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}