import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const ExpenseApprovalCard = ({ data, onApprove, onReject }) => {
  return (
    <Card className="shadow-sm rounded-2xl">
      <CardContent className="p-5 space-y-3">
        <div className="font-semibold text-lg">
          {data.employeeName}
        </div>

        <div className="text-sm text-gray-500">
          Category: {data.category}
        </div>

        <div className="font-bold text-green-600">
          ₹ {Number(data.amount).toLocaleString("en-IN")}
        </div>

        <div className="flex gap-2 pt-3">
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}