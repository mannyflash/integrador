"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface TimeSlot {
  time: string
  subject?: string
  teacher?: string
}

interface ScheduleData {
  [key: string]: {
    [key: string]: TimeSlot
  }
}

const DAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"]
const MORNING_TIMES = [
  "7:00-8:00", "8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00",
  "12:00-13:00", "13:00-14:00"
]
const EVENING_TIMES = [
  "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00",
  "19:00-20:00", "20:00-21:00", "21:00-22:00"
]

export default function ScheduleDashboard() {
  const [period, setPeriod] = useState("JULIO 2024 - ENERO 2025")
  const [schedule, setSchedule] = useState<ScheduleData>({})
  const [selectedSlot, setSelectedSlot] = useState<{day: string, time: string} | null>(null)

  const handleSaveSlot = (subject: string, teacher: string) => {
    if (!selectedSlot) return

    setSchedule(prev => ({
      ...prev,
      [selectedSlot.day]: {
        ...prev[selectedSlot.day],
        [selectedSlot.time]: {
          time: selectedSlot.time,
          subject,
          teacher
        }
      }
    }))
  }

  const renderTimeSlots = (times: string[]) => {
    return times.map(time => (
      <>
        <div key={`time-${time}`} className="p-2 text-center border">
          {time}
        </div>
        {DAYS.map(day => {
          const slot = schedule[day]?.[time]
          return (
            <Dialog key={`${day}-${time}`}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-full min-h-[80px] w-full"
                  onClick={() => setSelectedSlot({ day, time })}
                >
                  {slot ? (
                    <div className="text-xs">
                      <p className="font-semibold">{slot.subject}</p>
                      <p className="text-muted-foreground">{slot.teacher}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Click to add</span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Class Details</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    handleSaveSlot(
                      formData.get("subject") as string,
                      formData.get("teacher") as string
                    )
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      defaultValue={slot?.subject}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <Input
                      id="teacher"
                      name="teacher"
                      defaultValue={slot?.teacher}
                      required
                    />
                  </div>
                  <Button type="submit">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          )
        })}
      </>
    ))
  }

  const generatePDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4')
    
    // Add header
    doc.setFontSize(16)
    doc.text('INSTITUTO TECNOLOGICO SUPERIOR DE PUERTO PEÑASCO', 149, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('SUBDIRECCIÓN ACADEMICA', 149, 30, { align: 'center' })
    doc.text(`PERIODO: ${period}`, 149, 40, { align: 'center' })
    doc.text('LABORATORIO: TALLER DE PROGRAMACIÓN', 149, 50, { align: 'center' })

    // Prepare table data
    const tableData = [...MORNING_TIMES, ...EVENING_TIMES].map(time => {
      const row = [time]
      DAYS.forEach(day => {
        const slot = schedule[day]?.[time]
        row.push(slot ? `${slot.subject}\n${slot.teacher}` : '')
      })
      return row
    })

    // Add table
    doc.autoTable({
      startY: 60,
      head: [['HORA', ...DAYS]],
      body: tableData,
      theme: 'grid',
      styles: {
        cellPadding: 2,
        fontSize: 8,
        valign: 'middle',
        halign: 'center'
      },
      headStyles: {
        fillColor: [169, 169, 169],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      didDrawCell: (data: { cell: { text: string | any[]; x: number; y: number; width: number; height: number }; row: { index: number } }) => {
        // Add background color to cells with content
        if (data.cell.text.length > 0 && data.row.index >= 0) {
          doc.setFillColor(144, 238, 144) // Light green
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
          doc.setTextColor(0, 0, 0)
          doc.text(data.cell.text.toString(), data.cell.x + data.cell.width / 2, data.cell.y + 5, {
            align: 'center'
          })
        }
      }
    })

    doc.save('horario_laboratorio.pdf')
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <Card className="border-none shadow-none bg-background">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            INSTITUTO TECNOLOGICO SUPERIOR DE PUERTO PEÑASCO
          </CardTitle>
          <p className="text-xl font-semibold">SUBDIRECCIÓN ACADEMICA</p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    PERIODO: {period}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Period</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    setPeriod(formData.get("period") as string)
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="period">Period</Label>
                      <Input
                        id="period"
                        name="period"
                        defaultValue={period}
                        required
                      />
                    </div>
                    <Button type="submit">Save</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <p className="text-sm font-medium">LABORATORIO: TALLER DE PROGRAMACIÓN</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Schedule Grid */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-6 gap-2">
            {/* Header */}
            <div className="p-2 font-bold text-center bg-muted">HORA</div>
            {DAYS.map(day => (
              <div key={day} className="p-2 font-bold text-center bg-muted">
                {day}
              </div>
            ))}

            {/* Morning Shift Label */}
            <div className="col-span-6 bg-muted/50 p-2 text-center font-semibold">
              TURNO MATUTINO
            </div>

            {/* Morning Time Slots */}
            {renderTimeSlots(MORNING_TIMES)}

            {/* Evening Shift Label */}
            <div className="col-span-6 bg-blue-100 p-2 text-center font-semibold">
              TURNO VESPERTINO
            </div>

            {/* Evening Time Slots */}
            {renderTimeSlots(EVENING_TIMES)}
          </div>
        </div>
      </div>

      {/* Generate PDF Button */}
      <div className="flex justify-center">
        <Button onClick={generatePDF}>Generar PDF del Horario</Button>
      </div>
    </div>
  )
}

