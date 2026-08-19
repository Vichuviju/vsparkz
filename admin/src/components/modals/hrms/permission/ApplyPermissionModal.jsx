import { useState } from "react"
import { Button } from "@/components/ui/button"

const MONTHLY_LIMIT_HOURS = 4

export const ApplyPermissionModal = ({ open, setOpen, user }) => {
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  })

  if (!open) return null

  const calculateDuration = (start, end) => {
    const [h1, m1] = start.split(":").map(Number)
    const [h2, m2] = end.split(":").map(Number)
    return h2 + m2 / 60 - (h1 + m1 / 60)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const duration = calculateDuration(
      formData.startTime,
      formData.endTime
    )

    if (duration <= 0) return

    console.log({
      ...formData,
      duration,
      userId: user.id,
    })

    setOpen(false)
  }

  return (
    <div className="fixed inset-0 overflow-y-auto flex items-end sm:items-center justify-center p-3 z-[9999] bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-md space-y-4 max-h-[min(92dvh,40rem)] overflow-y-auto mb-[env(safe-area-inset-bottom)]">

        <h3 className="text-lg font-semibold">Apply Permission</h3>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="date"
            required
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="time"
              required
              className="border p-2 rounded"
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
            />
            <input
              type="time"
              required
              className="border p-2 rounded"
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
            />
          </div>

          <textarea
            placeholder="Reason"
            required
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>

            <Button type="submit" className="w-full">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
