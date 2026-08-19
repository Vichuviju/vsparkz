import { useMemo } from "react"
import { Clock, History, CheckCircle2 } from "lucide-react"

const MONTHLY_LIMIT_HOURS = 4

export const PermissionEmployeeView = ({ user }) => {
  // 🔥 Replace with API data
  const requests = []

  const usedHours = useMemo(() => {
    const currentMonth = new Date().getMonth()

    return requests
      .filter(
        (r) =>
          r.userId === user.id &&
          new Date(r.date).getMonth() === currentMonth &&
          r.status !== "REJECTED"
      )
      .reduce((acc, curr) => acc + curr.duration, 0)
  }, [requests, user.id])

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs text-gray-500 uppercase">Monthly Limit</p>
          <p className="text-xl font-bold">{MONTHLY_LIMIT_HOURS}h</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs text-gray-500 uppercase">Consumed</p>
          <p className="text-xl font-bold">{usedHours}h</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs text-gray-500 uppercase">Remaining</p>
          <p className="text-xl font-bold">
            {MONTHLY_LIMIT_HOURS - usedHours}h
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">
          Permission history will be shown here
        </p>
      </div>

    </div>
  )
}
