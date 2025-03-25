"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSpreadsheet, FileText, Search, RefreshCw } from "lucide-react"
import { format, parse, isValid, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "../pages/panel-laboratorista"
import { utils, writeFile } from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface Alumno {
  id: string
  nombre: string
  apellido: string
  equipo: string
  carrera: string
  semestre: string | number
  grupo: string
  turno: string
}

interface InfoClase {
  id: string
  alumnosIds: string[]
  fecha: Date
  maestroApellido: string
  maestroId: string
  maestroNombre: string
  materia: string
  practica: string
  totalAsistencias: number
  alumnos: Alumno[]
}

export default function VistaReporteMensual({
  esModoOscuro,
  logAction,
}: {
  esModoOscuro: boolean
  logAction: (action: string, details: string) => Promise<void>
}) {
  // State for date range filter
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const [filters, setFilters] = useState({
    docente: "",
    materia: "",
    grupoSemestre: "",
  })

  const [allPractices, setAllPractices] = useState<InfoClase[]>([])
  const [filteredPractices, setFilteredPractices] = useState<InfoClase[]>([])
  const [loading, setLoading] = useState(false)
  const reportTableRef = useRef<HTMLDivElement>(null)

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const refInfoClase = collection(db, "ClassInformation")
      const consultaInfoClase = query(refInfoClase, orderBy("fecha", "desc"))
      const snapshotInfoClase = await getDocs(consultaInfoClase)

      const datosInfoClase = snapshotInfoClase.docs.map((doc) => {
        const data = doc.data()
        let fecha: Date
        if (data.fecha instanceof Timestamp) {
          fecha = data.fecha.toDate()
        } else if (typeof data.fecha === "string") {
          const parsedDate = parse(data.fecha, "dd/MM/yyyy", new Date())
          fecha = isValid(parsedDate) ? parsedDate : new Date(data.fecha)
        } else {
          fecha = new Date(data.fecha)
        }
        return {
          id: doc.id,
          ...data,
          fecha,
          alumnos: data.alumnos || [],
        } as InfoClase
      })

      setAllPractices(datosInfoClase)
      await logAction("fetch_records", `Fetched ${datosInfoClase.length} practice records`)

      // Apply initial filtering
      applyFilters(datosInfoClase)
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters to the practices
  const applyFilters = (practices = allPractices) => {
    let filtered = [...practices]

    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((practice) =>
        isWithinInterval(practice.fecha, {
          start: dateRange.from as Date,
          end: dateRange.to as Date,
        }),
      )
    }

    // Apply text filters
    if (filters.docente) {
      filtered = filtered.filter((practice) =>
        `${practice.maestroNombre} ${practice.maestroApellido}`.toLowerCase().includes(filters.docente.toLowerCase()),
      )
    }

    if (filters.materia) {
      filtered = filtered.filter((practice) => practice.materia.toLowerCase().includes(filters.materia.toLowerCase()))
    }

    if (filters.grupoSemestre) {
      filtered = filtered.filter((practice) => {
        const grupos = practice.alumnos.map((a) => a.grupo)
        const semestres = practice.alumnos.map((a) => a.semestre.toString())

        return (
          grupos.some((grupo) => grupo.toLowerCase().includes(filters.grupoSemestre.toLowerCase())) ||
          semestres.some((semestre) => semestre.toLowerCase().includes(filters.grupoSemestre.toLowerCase()))
        )
      })
    }

    setFilteredPractices(filtered)
  }

  // Format date for display
  const formatDate = (date: Date): string => {
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  // Handle date range changes
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    setDateRange((prev) => ({ ...prev, from: date }))
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    setDateRange((prev) => ({ ...prev, to: date }))
  }

  // Calculate totals and averages
  const totalPractices = filteredPractices.length
  const totalStudents = filteredPractices.reduce((sum, practice) => sum + practice.totalAsistencias, 0)
  const averageStudents = totalPractices > 0 ? Math.round(totalStudents / totalPractices) : 0

  // Function to export to Excel
  const exportToExcel = async () => {
    try {
      const worksheet = utils.json_to_sheet(
        filteredPractices.map((practice) => ({
          Fecha: formatDate(practice.fecha),
          Docente: `${practice.maestroNombre} ${practice.maestroApellido}`,
          Materia: practice.materia,
          "Nombre de Práctica": practice.practica,
          "Grupo y Semestre": Array.from(new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`))).join(", "),
          "Número de Alumnos": practice.totalAsistencias,
        })),
      )

      const workbook = utils.book_new()
      utils.book_append_sheet(workbook, worksheet, "Reporte de Laboratorio")

      // Generate filename with date range
      const fromDate = dateRange.from ? format(dateRange.from, "dd-MM-yyyy") : "inicio"
      const toDate = dateRange.to ? format(dateRange.to, "dd-MM-yyyy") : "fin"
      const filename = `Reporte_Laboratorio_${fromDate}_a_${toDate}.xlsx`

      writeFile(workbook, filename)
      await logAction("export_excel", `Exported ${filteredPractices.length} records to Excel`)
    } catch (error) {
      console.error("Error exporting to Excel:", error)
    }
  }

  // Function to export to PDF
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF()

      // Add header
      doc.setFontSize(18)
      doc.text("Instituto Tecnológico Superior", 105, 20, { align: "center" })
      doc.setFontSize(14)
      doc.text("Reporte de Uso de Laboratorio", 105, 30, { align: "center" })

      // Add period
      const fromDate = dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }).toUpperCase() : "INICIO"
      const toDate = dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }).toUpperCase() : "FIN"
      doc.text(`PERÍODO: ${fromDate} - ${toDate}`, 105, 40, { align: "center" })

      // Add table
      const tableData = filteredPractices.map((practice) => [
        formatDate(practice.fecha),
        `${practice.maestroNombre} ${practice.maestroApellido}`,
        practice.materia,
        practice.practica,
        Array.from(new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`))).join(", "),
        practice.totalAsistencias.toString(),
      ])

      // @ts-ignore - jspdf-autotable types are not fully compatible
      doc.autoTable({
        startY: 50,
        head: [["Fecha", "Docente", "Materia", "Nombre de Práctica", "Grupo y Semestre", "Número de Alumnos"]],
        body: tableData,
      })

      // Add totals
      const finalY = (doc as any).lastAutoTable.finalY || 150
      doc.text(`Total de prácticas: ${totalPractices}`, 14, finalY + 10)
      doc.text(`Total de alumnos: ${totalStudents}`, 14, finalY + 20)
      doc.text(`Promedio de alumnos por práctica: ${averageStudents}`, 14, finalY + 30)

      // Add signature line
      doc.text("_______________________________", 105, finalY + 50, { align: "center" })
      doc.text("Responsable de Laboratorio", 105, finalY + 60, { align: "center" })

      // Generate filename with date range
      const fromDateFilename = dateRange.from ? format(dateRange.from, "dd-MM-yyyy") : "inicio"
      const toDateFilename = dateRange.to ? format(dateRange.to, "dd-MM-yyyy") : "fin"
      const filename = `Reporte_Laboratorio_${fromDateFilename}_a_${toDateFilename}.pdf`

      doc.save(filename)
      await logAction("export_pdf", `Exported ${filteredPractices.length} records to PDF`)
    } catch (error) {
      console.error("Error exporting to PDF:", error)
    }
  }

  // Load records on initial render
  useEffect(() => {
    fetchRecords()
  }, [])

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters()
  }, [dateRange, filters])

  return (
    <div className="space-y-6">
      <Card className={esModoOscuro ? "bg-gray-800" : "bg-white"}>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className={esModoOscuro ? "text-white" : "text-green-800"}>
              Reporte Mensual de Uso de Laboratorio
            </CardTitle>
            <p className={esModoOscuro ? "text-gray-300" : "text-green-700"}>
              Período: {dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }) : "Inicio"} -
              {dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }) : "Fin"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => fetchRecords()} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {loading ? "Cargando..." : "Actualizar Datos"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reporte" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="reporte">Reporte</TabsTrigger>
            </TabsList>

            <TabsContent value="reporte" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">Fecha Inicio</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                    onChange={handleDateFromChange}
                    className={esModoOscuro ? "bg-gray-700 border-gray-600" : "bg-green-50 border-green-300"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">Fecha Fin</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                    onChange={handleDateToChange}
                    className={esModoOscuro ? "bg-gray-700 border-gray-600" : "bg-green-50 border-green-300"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-docente">Docente</Label>
                  <Input
                    id="filter-docente"
                    placeholder="Filtrar por docente"
                    value={filters.docente}
                    onChange={(e) => setFilters({ ...filters, docente: e.target.value })}
                    className={esModoOscuro ? "bg-gray-700 border-gray-600" : "bg-green-50 border-green-300"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-materia">Materia</Label>
                  <Input
                    id="filter-materia"
                    placeholder="Filtrar por materia"
                    value={filters.materia}
                    onChange={(e) => setFilters({ ...filters, materia: e.target.value })}
                    className={esModoOscuro ? "bg-gray-700 border-gray-600" : "bg-green-50 border-green-300"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-grupo">Grupo/Semestre</Label>
                  <Input
                    id="filter-grupo"
                    placeholder="Filtrar por grupo o semestre"
                    value={filters.grupoSemestre}
                    onChange={(e) => setFilters({ ...filters, grupoSemestre: e.target.value })}
                    className={esModoOscuro ? "bg-gray-700 border-gray-600" : "bg-green-50 border-green-300"}
                  />
                </div>
                <div className="flex items-end md:col-span-3">
                  <div className="flex gap-2 w-full justify-end">
                    <Button variant="outline" onClick={exportToExcel} disabled={filteredPractices.length === 0}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button variant="outline" onClick={exportToPDF} disabled={filteredPractices.length === 0}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div ref={reportTableRef} className="rounded-md border">
                <div className="bg-green-800 text-white p-4 text-center">
                  <h2 className="text-xl font-bold">Instituto Tecnológico Superior</h2>
                  <p>Reporte de Uso de Laboratorio</p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Docente</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Nombre de Práctica</TableHead>
                      <TableHead>Grupo y Semestre</TableHead>
                      <TableHead className="text-right">Número de Alumnos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPractices.length > 0 ? (
                      filteredPractices.map((practice) => (
                        <TableRow key={practice.id}>
                          <TableCell>{formatDate(practice.fecha)}</TableCell>
                          <TableCell>{`${practice.maestroNombre} ${practice.maestroApellido}`}</TableCell>
                          <TableCell>{practice.materia}</TableCell>
                          <TableCell>{practice.practica}</TableCell>
                          <TableCell>
                            {Array.from(new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`))).join(", ")}
                          </TableCell>
                          <TableCell className="text-right">{practice.totalAsistencias}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          {loading ? "Cargando registros..." : "No hay registros para mostrar"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="p-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-3 rounded-md ${esModoOscuro ? "bg-gray-700" : "bg-green-100"}`}>
                      <p className="text-sm font-medium">Total de prácticas</p>
                      <p className="text-2xl font-bold">{totalPractices}</p>
                    </div>
                    <div className={`p-3 rounded-md ${esModoOscuro ? "bg-gray-700" : "bg-green-100"}`}>
                      <p className="text-sm font-medium">Total de alumnos</p>
                      <p className="text-2xl font-bold">{totalStudents}</p>
                    </div>
                    <div className={`p-3 rounded-md ${esModoOscuro ? "bg-gray-700" : "bg-green-100"}`}>
                      <p className="text-sm font-medium">Promedio de alumnos</p>
                      <p className="text-2xl font-bold">{averageStudents}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t text-center">
                  <div className="mt-8 inline-block border-t border-gray-300 pt-2 w-64">
                    <p>Firma del Responsable de Laboratorio</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

