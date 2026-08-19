import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"
import { formatDate } from "@/lib/utils";

export const LoanRequestCard = ({
  data,
  onView,
  onApprove,
  onProcess,
  onReject,
}) => {
  const {
    employeeName,
    role,
    avatar,
    loanName,
    amount,
    currency,
    installments,
    reason,
    date,
    stage, // submitted | hr | finance
  } = data

  const Step = ({ label, active }) => (
    <div className="flex items-center gap-2">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          active ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <span
        className={`text-sm ${
          active ? "text-green-600 font-medium" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  )

  return (
    <Card className="rounded-2xl shadow-sm border bg-white">
      <CardContent className="p-6 space-y-5">

        {/* Top Progress */}
        <div className="flex items-center justify-between">
          <Step label="Submitted" active />
          <div className="flex-1 h-[1px] bg-gray-200 mx-2" />
          <Step label="HR" active={stage !== "submitted"} />
          <div className="flex-1 h-[1px] bg-gray-200 mx-2" />
          <Step label="Finance" active={stage === "finance"} />
        </div>

        {/* Profile + Loan Name */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img
              src={avatar}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-lg">{employeeName}</p>
              <p className="text-sm text-gray-500">{role}</p>
            </div>
          </div>

          <Badge className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm">
            {loanName}
          </Badge>
        </div>

        {/* Amount + Installments */}
        <div className="flex justify-between text-sm">
          <p>
            <span className="text-gray-500">Amount:</span>{" "}
            <span className="font-semibold">
              {amount.toFixed(2)} {currency}
            </span>
          </p>

          <p>
            <span className="text-gray-500">No. of Instalments:</span>{" "}
            <span className="font-semibold">
              {installments.toString().padStart(2, "0")}
            </span>
          </p>
        </div>

        {/* Reason */}
        <p className="text-sm text-gray-600">{reason}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays size={16} />
            {formatDate(date)}
          </div>

          <div className="flex gap-3">

            {stage === "submitted" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => onView?.(data)}
                >
                  View
                </Button>

                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove?.(data)}
                >
                  HR Approve
                </Button>
              </>
            )}

            {stage === "hr" && (
              <>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onProcess?.(data)}
                >
                  Process Payment
                </Button>
              </>
            )}

            <Button
              variant="destructive"
              onClick={() => onReject?.(data)}
            >
              Reject
            </Button>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}