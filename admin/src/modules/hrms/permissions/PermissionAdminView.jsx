import { Button } from "@/components/ui/button"

export const PermissionAdminView = () => {

  // 🔥 Replace with API data
  const requests = []

  const pending = requests.filter((r) => r.status === "PENDING")
  const history = requests.filter((r) => r.status !== "PENDING")

  return (
    <div className="space-y-6">

      <h3 className="text-lg font-semibold">Pending Requests</h3>

      {pending.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No pending requests
        </div>
      ) : (
        pending.map((req) => (
          <div key={req.id} className="bg-white p-5 rounded-lg shadow">
            <p className="font-semibold">{req.userName}</p>
            <p className="text-sm text-gray-500">
              {req.date} ({req.duration}h)
            </p>

            <div className="flex gap-2 mt-3">
              <Button variant="outline">Reject</Button>
              <Button>Approve</Button>
            </div>
          </div>
        ))
      )}

      <h3 className="text-lg font-semibold mt-8">Request Log</h3>

      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">
          Processed requests history
        </p>
      </div>

    </div>
  )
}
