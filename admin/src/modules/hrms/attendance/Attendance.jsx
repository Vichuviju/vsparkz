import React, { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { Clock, LogIn, LogOut, History } from "lucide-react"

export const AttendanceLogin = () => {
  const [attendance, setAttendance] = useState([])
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [message, setMessage] = useState(null)

  const currentLog = attendance.find(
    (a) => a.date === selectedDate
  )

  const handleAttendance = (type) => {
    let updatedLogs = [...attendance]

    if (type === "IN") {
      if (currentLog?.checkIn) return

      updatedLogs.push({
        date: selectedDate,
        checkIn: new Date(),
        status: "Present",
      })
    } else {
      updatedLogs = updatedLogs.map((log) =>
        log.date === selectedDate
          ? { ...log, checkOut: new Date() }
          : log
      )
    }

    setAttendance(updatedLogs)

    setMessage(`Successfully clocked ${type}`)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <Clock className="text-primary" />
        </div>

        {/* Success Message */}
        {message && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-md text-sm">
            {message}
          </div>
        )}

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => handleAttendance("IN")}
                disabled={currentLog?.checkIn}
                className="flex items-center gap-2"
              >
                <LogIn size={18} />
                Check In
              </Button>

              <Button
                variant="destructive"
                onClick={() => handleAttendance("OUT")}
                disabled={!currentLog?.checkIn || currentLog?.checkOut}
                className="flex items-center gap-2"
              >
                <LogOut size={18} />
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={18} />
              Recent Records
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-64 overflow-y-auto pr-4">
              {attendance.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No records found.
                </p>
              ) : (
                attendance
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((log, index) => (
                    <div
                      key={index}
                      className="flex justify-between py-3 border-b"
                    >
                      <div>
                        <p className="font-medium">{log.date}</p>
                        <Badge>{log.status || "Pending"}</Badge>
                      </div>

                      <div className="text-right text-sm">
                        <p>
                          In:{" "}
                          {log.checkIn
                            ? log.checkIn.toLocaleTimeString()
                            : "--:--"}
                        </p>
                        <p>
                          Out:{" "}
                          {log.checkOut
                            ? log.checkOut.toLocaleTimeString()
                            : "--:--"}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
