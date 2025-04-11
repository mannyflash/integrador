"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  Calendar,
  User,
  BookOpen,
  Users,
  School,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { format, parse, isValid, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns"
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
  // Definición de colores basada en el tema
  const colors = {
    light: {
      primary: "#800040", // Guinda/vino como color principal en modo claro
      secondary: "#1d5631", // Verde oscuro como color secundario
      tertiary: "#74726f", // Gris para elementos terciarios
      background: "#fff0f5", // Fondo con tono rosado muy suave
      cardBackground: "bg-white",
      headerBackground: "bg-gradient-to-r from-[#800040] to-[#a30050]",
      titleText: "text-[#800040]",
      descriptionText: "text-[#800040]/80",
      hoverBackground: "hover:bg-[#fff0f5]",
      buttonPrimary: "bg-[#800040] hover:bg-[#5c002e] text-white",
      buttonSecondary: "bg-[#1d5631] hover:bg-[#153d23] text-white",
      buttonTertiary: "bg-[#74726f] hover:bg-[#5a5856] text-white",
      countBackground: "bg-[#fff0f5]",
      countText: "text-[#800040]",
      inputBackground: "bg-[#f8f8f8]",
      inputBorder: "border-[#800040]/30",
      inputText: "text-[#800040]",
      tableHeaderBg: "bg-[#800040]",
      tableRowEvenBg: "bg-white",
      tableRowOddBg: "bg-[#fff0f5]",
      tableRowHover: "hover:bg-[#fff0f5]/70",
      statCardBg: "bg-[#fff0f5]",
      statCardText: "text-[#800040]",
    },
    dark: {
      primary: "#1d5631", // Verde oscuro como color principal en modo oscuro
      secondary: "#800040", // Guinda/vino como color secundario
      tertiary: "#74726f", // Gris para elementos terciarios
      background: "#0c1f15", // Fondo verde muy oscuro
      cardBackground: "bg-[#2a2a2a]",
      headerBackground: "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]",
      titleText: "text-white",
      descriptionText: "text-gray-300",
      hoverBackground: "hover:bg-[#153d23]",
      buttonPrimary: "bg-[#1d5631] hover:bg-[#153d23] text-white",
      buttonSecondary: "bg-[#800040] hover:bg-[#5c002e] text-white",
      buttonTertiary: "bg-[#74726f] hover:bg-[#5a5856] text-white",
      countBackground: "bg-[#1d5631]/20",
      countText: "text-[#2a7a45]",
      inputBackground: "bg-[#3a3a3a]",
      inputBorder: "border-[#1d5631]/30",
      inputText: "text-white",
      tableHeaderBg: "bg-[#1d5631]",
      tableRowEvenBg: "bg-[#2a2a2a]",
      tableRowOddBg: "bg-[#1d5631]/10",
      tableRowHover: "hover:bg-[#1d5631]/20",
      statCardBg: "bg-[#1d5631]/20",
      statCardText: "text-[#2a7a45]",
    },
  }

  // Seleccionar el tema según el modo
  const theme = esModoOscuro ? colors.dark : colors.light

  // Opciones predefinidas para filtros rápidos
  const periodoOptions = [
    { label: "Este mes", value: "current", from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    {
      label: "Mes anterior",
      value: "previous",
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    },
    {
      label: "Últimos 3 meses",
      value: "last3",
      from: startOfMonth(subMonths(new Date(), 2)),
      to: endOfMonth(new Date()),
    },
    { label: "Personalizado", value: "custom", from: undefined, to: undefined },
  ]

  // State for date range filter
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
    preset: string
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
    preset: "current",
  })

  const [filters, setFilters] = useState({
    docente: "",
    materia: "",
    grupoSemestre: "",
  })

  const [allPractices, setAllPractices] = useState<InfoClase[]>([])
  const [filteredPractices, setFilteredPractices] = useState<InfoClase[]>([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState("reporte")
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: "success" | "error"
  }>({ show: false, message: "", type: "success" })

  const reportTableRef = useRef<HTMLDivElement>(null)

  // Mostrar notificación
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }))
    }, 3000)
  }

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
      showNotification(`Se cargaron ${datosInfoClase.length} registros correctamente`, "success")

      // Apply initial filtering
      applyFilters(datosInfoClase)
    } catch (error) {
      console.error("Error fetching records:", error)
      showNotification("Error al cargar los registros", "error")
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
    setDateRange((prev) => ({ ...prev, from: date, preset: "custom" }))
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    setDateRange((prev) => ({ ...prev, to: date, preset: "custom" }))
  }

  // Manejar cambio de periodo predefinido
  const handlePeriodChange = (preset: string) => {
    const selectedOption = periodoOptions.find((option) => option.value === preset)
    if (selectedOption) {
      setDateRange({
        from: selectedOption.from,
        to: selectedOption.to,
        preset,
      })
    }
  }

  // Calculate totals and averages
  const totalPractices = filteredPractices.length
  const totalStudents = filteredPractices.reduce((sum, practice) => sum + practice.totalAsistencias, 0)
  const averageStudents = totalPractices > 0 ? Math.round(totalStudents / totalPractices) : 0

  // Obtener materias únicas y contar prácticas por materia
  const materiaStats = filteredPractices.reduce(
    (acc, practice) => {
      const materia = practice.materia
      if (!acc[materia]) {
        acc[materia] = { count: 0, students: 0 }
      }
      acc[materia].count += 1
      acc[materia].students += practice.totalAsistencias
      return acc
    },
    {} as Record<string, { count: number; students: number }>,
  )

  // Ordenar materias por número de prácticas
  const topMaterias = Object.entries(materiaStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  // Obtener docentes únicos y contar prácticas por docente
  const docenteStats = filteredPractices.reduce(
    (acc, practice) => {
      const docente = `${practice.maestroNombre} ${practice.maestroApellido}`
      if (!acc[docente]) {
        acc[docente] = { count: 0, students: 0 }
      }
      acc[docente].count += 1
      acc[docente].students += practice.totalAsistencias
      return acc
    },
    {} as Record<string, { count: number; students: number }>,
  )

  // Ordenar docentes por número de prácticas
  const topDocentes = Object.entries(docenteStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  // Obtener distribución por carreras
  const carreraStats = filteredPractices.reduce(
    (acc, practice) => {
      practice.alumnos.forEach((alumno) => {
        if (!acc[alumno.carrera]) {
          acc[alumno.carrera] = 0
        }
        acc[alumno.carrera]++
      })
      return acc
    },
    {} as Record<string, number>,
  )

  // Ordenar carreras por número de estudiantes
  const topCarreras = Object.entries(carreraStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Function to export to Excel with mejoras
  const exportToExcel = async () => {
    try {
      setExportLoading("excel")

      // Crear un nuevo libro de trabajo
      const workbook = utils.book_new()

      // Configurar metadatos del documento
      workbook.Props = {
        Title: "Reporte de Uso de Laboratorio",
        Subject: "Estadísticas de uso del laboratorio",
        Author: "Sistema de Gestión de Laboratorio",
        CreatedDate: new Date(),
        Company: "Instituto Tecnológico Superior",
      }

      // Formatear fechas para el título
      const fromDate = dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }) : "Inicio"
      const toDate = dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }) : "Fin"
      const periodoTexto = `${fromDate} al ${toDate}`

      // HOJA 1: RESUMEN EJECUTIVO
      const resumenData = [
        ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"],
        ["REPORTE DE USO DEL LABORATORIO DE PROGRAMACIÓN"],
        [`PERÍODO: ${periodoTexto.toUpperCase()}`],
        [""],
        ["RESUMEN EJECUTIVO"],
        [""],
        ["Indicador", "Valor", "Observaciones"],
        ["Total de prácticas realizadas", totalPractices, "Prácticas registradas en el sistema"],
        ["Total de estudiantes atendidos", totalStudents, "Suma de todas las asistencias"],
        ["Promedio de estudiantes por práctica", averageStudents, "Indicador de ocupación"],
        ["Materias diferentes impartidas", Object.keys(materiaStats).length, "Diversidad de contenidos"],
        ["Docentes participantes", Object.keys(docenteStats).length, "Personal académico involucrado"],
        [""],
        ["MATERIAS CON MAYOR NÚMERO DE PRÁCTICAS"],
        ["Materia", "Prácticas", "Estudiantes"],
      ]

      // Agregar top materias
      topMaterias.forEach(([materia, stats]) => {
        resumenData.push([materia, stats.count, stats.students])
      })

      resumenData.push([""], ["DOCENTES CON MAYOR ACTIVIDAD"], ["Docente", "Prácticas", "Estudiantes"])

      // Agregar top docentes
      topDocentes.forEach(([docente, stats]) => {
        resumenData.push([docente, stats.count, stats.students])
      })

      // Crear hoja de resumen
      const resumenSheet = utils.aoa_to_sheet(resumenData)

      // Aplicar estilos a la hoja de resumen (mediante ancho de columnas)
      resumenSheet["!cols"] = [
        { wch: 40 }, // A
        { wch: 15 }, // B
        { wch: 40 }, // C
      ]

      // Agregar la hoja al libro
      utils.book_append_sheet(workbook, resumenSheet, "Resumen Ejecutivo")

      // HOJA 2: DATOS DETALLADOS
      const detallesData = [
        ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"],
        ["REPORTE DETALLADO DE PRÁCTICAS DE LABORATORIO"],
        [`PERÍODO: ${periodoTexto.toUpperCase()}`],
        [""],
        ["Fecha", "Materia", "Práctica", "Docente", "Grupo", "Semestre", "Carrera", "Estudiantes"],
      ]

      // Agregar datos detallados de cada práctica
      filteredPractices.forEach((practice) => {
        const grupos = Array.from(new Set(practice.alumnos.map((a) => a.grupo))).join(", ")
        const semestres = Array.from(new Set(practice.alumnos.map((a) => a.semestre))).join(", ")
        const carreras = Array.from(new Set(practice.alumnos.map((a) => a.carrera))).join(", ")

        detallesData.push([
          formatDate(practice.fecha),
          practice.materia,
          practice.practica,
          `${practice.maestroNombre} ${practice.maestroApellido}`,
          grupos,
          semestres,
          carreras,
          practice.totalAsistencias.toString(),
        ])
      })

      // Crear hoja de detalles
      const detallesSheet = utils.aoa_to_sheet(detallesData)

      // Aplicar estilos a la hoja de detalles (mediante ancho de columnas)
      detallesSheet["!cols"] = [
        { wch: 12 }, // Fecha
        { wch: 25 }, // Materia
        { wch: 30 }, // Práctica
        { wch: 25 }, // Docente
        { wch: 10 }, // Grupo
        { wch: 10 }, // Semestre
        { wch: 25 }, // Carrera
        { wch: 12 }, // Estudiantes
      ]

      // Agregar la hoja al libro
      utils.book_append_sheet(workbook, detallesSheet, "Datos Detallados")

      // HOJA 3: ESTADÍSTICAS POR CARRERA
      const carrerasData = [
        ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"],
        ["ESTADÍSTICAS DE ASISTENCIA POR CARRERA"],
        [`PERÍODO: ${periodoTexto.toUpperCase()}`],
        [""],
        ["Carrera", "Estudiantes", "Porcentaje"],
      ]

      // Agregar datos de carreras
      Object.entries(carreraStats).forEach(([carrera, count]) => {
        const porcentaje = ((count / totalStudents) * 100).toFixed(2) + "%"
        carrerasData.push([carrera, count.toString(), porcentaje])
      })

      // Crear hoja de estadísticas por carrera
      const carrerasSheet = utils.aoa_to_sheet(carrerasData)

      // Aplicar estilos a la hoja de carreras
      carrerasSheet["!cols"] = [
        { wch: 40 }, // Carrera
        { wch: 15 }, // Estudiantes
        { wch: 15 }, // Porcentaje
      ]

      // Agregar la hoja al libro
      utils.book_append_sheet(workbook, carrerasSheet, "Estadísticas por Carrera")

      // Generate filename with date range
      const fromDateFilename = dateRange.from ? format(dateRange.from, "dd-MM-yyyy") : "inicio"
      const toDateFilename = dateRange.to ? format(dateRange.to, "dd-MM-yyyy") : "fin"
      const filename = `Reporte_Laboratorio_${fromDateFilename}_a_${toDateFilename}.xlsx`

      // Guardar el archivo
      writeFile(workbook, filename)
      await logAction("export_excel", `Exported ${filteredPractices.length} records to Excel with enhanced formatting`)
      showNotification(`Reporte exportado a Excel correctamente`, "success")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      showNotification("Error al exportar a Excel", "error")
    } finally {
      setExportLoading(null)
    }
  }

  // Function to export to PDF with mejoras
  const exportToPDF = async () => {
    try {
      setExportLoading("pdf")

      // Crear un nuevo documento PDF en formato HORIZONTAL
      const doc = new jsPDF({
        orientation: "landscape", // Formato horizontal
        unit: "mm",
        format: "a4",
      })

      // Configurar metadatos del documento
      doc.setProperties({
        title: "Reporte de Uso de Laboratorio",
        subject: "Estadísticas de uso del laboratorio",
        author: "Sistema de Gestión de Laboratorio",
        creator: "Instituto Tecnológico Superior",
      })

      // Formatear fechas para el título
      const fromDate = dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }) : "Inicio"
      const toDate = dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }) : "Fin"

      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      const headerHeight = 60 // Altura aproximada del encabezado
      const rowHeight = 10 // Altura aproximada de cada fila
      const footerHeight = 30 // Altura aproximada del pie de página
      const contentHeight = pageHeight - headerHeight - footerHeight - margin * 2
      const rowsPerPage = Math.floor(contentHeight / rowHeight)

      // Función para añadir encabezado a cada página
      const addHeader = (pageNum: number) => {
        // Fondo del encabezado (gris oscuro en lugar de color)
        doc.setFillColor(50, 50, 50)
        doc.rect(margin, margin, contentWidth, headerHeight - margin, "F")

        // Título y subtítulos
        doc.setTextColor(255, 255, 255) // Texto blanco
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("Instituto Tecnológico Superior", pageWidth / 2, margin + 15, { align: "center" })

        doc.setFontSize(14)
        doc.text("Reporte de Uso de Laboratorio", pageWidth / 2, margin + 25, { align: "center" })

        doc.setFontSize(10)
        doc.text(`Período: ${fromDate} - ${toDate}`, pageWidth / 2, margin + 35, { align: "center" })

        // Número de página
        doc.setFontSize(8)
        doc.text(`Página ${pageNum}`, pageWidth - margin - 10, pageHeight - margin, { align: "right" })

        // Encabezados de tabla
        const startY = margin + headerHeight - 10

        // Fondo de encabezados de tabla (gris medio)
        doc.setFillColor(80, 80, 80)
        doc.rect(margin, startY, contentWidth, rowHeight, "F")

        // Textos de encabezados
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")

        const colWidths = [
          contentWidth * 0.1, // Fecha
          contentWidth * 0.2, // Docente
          contentWidth * 0.2, // Materia
          contentWidth * 0.25, // Práctica
          contentWidth * 0.15, // Grupo/Semestre
          contentWidth * 0.1, // Alumnos
        ]

        let currentX = margin

        // Encabezados de columnas
        doc.text("FECHA", currentX + colWidths[0] / 2, startY + 6, { align: "center" })
        currentX += colWidths[0]

        doc.text("DOCENTE", currentX + colWidths[1] / 2, startY + 6, { align: "center" })
        currentX += colWidths[1]

        doc.text("MATERIA", currentX + colWidths[2] / 2, startY + 6, { align: "center" })
        currentX += colWidths[2]

        doc.text("NOMBRE PRÁCTICA", currentX + colWidths[3] / 2, startY + 6, { align: "center" })
        currentX += colWidths[3]

        doc.text("GRUPO Y SEMESTRE", currentX + colWidths[4] / 2, startY + 6, { align: "center" })
        currentX += colWidths[4]

        doc.text("ALUMNOS", currentX + colWidths[5] / 2, startY + 6, { align: "center" })

        return { startY: startY + rowHeight, colWidths }
      }

      // Función para añadir pie de página con resumen
      const addFooter = (lastPage = false) => {
        if (lastPage) {
          const footerY = pageHeight - footerHeight - margin

          // Resumen
          doc.setFillColor(240, 240, 240)
          doc.rect(margin, footerY, contentWidth, footerHeight - margin, "F")

          // Texto del resumen
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")

          // Estadísticas en tres columnas
          const colWidth = contentWidth / 3

          // Total prácticas
          doc.text("Total de prácticas:", margin + 10, footerY + 12)
          doc.text(totalPractices.toString(), margin + colWidth - 20, footerY + 12, { align: "right" })

          // Total alumnos
          doc.text("Total de alumnos:", margin + colWidth + 10, footerY + 12)
          doc.text(totalStudents.toString(), margin + colWidth * 2 - 20, footerY + 12, { align: "right" })

          // Promedio alumnos
          doc.text("Promedio de alumnos:", margin + colWidth * 2 + 10, footerY + 12)
          doc.text(averageStudents.toString(), margin + colWidth * 3 - 20, footerY + 12, { align: "right" })
        }
      }

      // Iniciar primera página
      let pageNum = 1
      const { startY, colWidths } = addHeader(pageNum)
      let currentY = startY

      // Dibujar filas de datos
      for (let i = 0; i < filteredPractices.length; i++) {
        const practice = filteredPractices[i]

        // Verificar si necesitamos una nueva página
        if (currentY + rowHeight > pageHeight - footerHeight - margin) {
          // Añadir pie de página a la página actual
          addFooter(false)

          // Añadir nueva página
          doc.addPage()
          pageNum++
          const headerInfo = addHeader(pageNum)
          currentY = headerInfo.startY
        }

        // Alternar colores de fondo para las filas (blanco y gris claro)
        if (i % 2 === 0) {
          doc.setFillColor(255, 255, 255) // Filas pares: blanco
        } else {
          doc.setFillColor(240, 240, 240) // Filas impares: gris claro
        }
        doc.rect(margin, currentY, contentWidth, rowHeight, "F")

        // Dibujar líneas de la tabla
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.1)

        // Línea horizontal inferior
        doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight)

        // Líneas verticales
        let currentX = margin
        for (let j = 0; j < colWidths.length; j++) {
          currentX += colWidths[j]
          doc.line(currentX, currentY, currentX, currentY + rowHeight)
        }

        // Texto de las celdas
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")

        currentX = margin

        // Fecha
        doc.text(formatDate(practice.fecha), currentX + colWidths[0] / 2, currentY + 6, { align: "center" })
        currentX += colWidths[0]

        // Docente
        const docenteText = `${practice.maestroNombre} ${practice.maestroApellido}`
        doc.text(docenteText, currentX + 3, currentY + 6, { align: "left", maxWidth: colWidths[1] - 6 })
        currentX += colWidths[1]

        // Materia
        doc.text(practice.materia, currentX + 3, currentY + 6, { align: "left", maxWidth: colWidths[2] - 6 })
        currentX += colWidths[2]

        // Práctica
        doc.text(practice.practica, currentX + 3, currentY + 6, { align: "left", maxWidth: colWidths[3] - 6 })
        currentX += colWidths[3]

        // Grupo y Semestre
        const grupoSemestre = Array.from(new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`))).join(", ")
        doc.text(grupoSemestre, currentX + colWidths[4] / 2, currentY + 6, {
          align: "center",
          maxWidth: colWidths[4] - 6,
        })
        currentX += colWidths[4]

        // Alumnos
        doc.text(practice.totalAsistencias.toString(), currentX + colWidths[5] / 2, currentY + 6, { align: "center" })

        // Avanzar a la siguiente fila
        currentY += rowHeight
      }

      // Añadir pie de página a la última página
      addFooter(true)

      // Generar nombre de archivo
      const fromDateFilename = dateRange.from ? format(dateRange.from, "MM-yyyy") : "inicio"
      const toDateFilename = dateRange.to ? format(dateRange.to, "MM-yyyy") : "fin"
      const filename = `Reporte_Laboratorio_${fromDateFilename}_a_${toDateFilename}.pdf`

      // Guardar el archivo
      doc.save(filename)
      await logAction(
        "export_pdf",
        `Exported ${filteredPractices.length} records to PDF with exact frontend appearance`,
      )
      showNotification(`Reporte exportado a PDF correctamente`, "success")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      showNotification("Error al exportar a PDF", "error")
    } finally {
      setExportLoading(null)
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
      {/* Notificación */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 animate-in slide-in-from-top-5 ${
            notification.type === "success"
              ? esModoOscuro
                ? "bg-[#1d5631]/90 text-white"
                : "bg-[#800040]/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      <Card
        className={`${esModoOscuro ? colors.dark.cardBackground : colors.light.cardBackground} overflow-hidden shadow-lg border-0`}
      >
        <CardHeader
          className={`${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} text-white rounded-t-lg p-6`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white text-xl md:text-2xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Reporte Mensual de Uso de Laboratorio
              </CardTitle>
              <CardDescription className="text-white/80 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período: {dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }) : "Inicio"} -
                {dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }) : "Fin"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className={`${esModoOscuro ? "bg-white/20 hover:bg-white/30" : "bg-white/20 hover:bg-white/30"} text-white transition-all duration-200 shadow-sm`}
                onClick={() => fetchRecords()}
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {loading ? "Cargando..." : "Actualizar"}
              </Button>
              <Button
                className={`${esModoOscuro ? "bg-white/20 hover:bg-white/30" : "bg-white/20 hover:bg-white/30"} text-white transition-all duration-200 shadow-sm`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filtros */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? "max-h-96" : "max-h-0"}`}
        >
          <div className={`p-4 ${esModoOscuro ? "bg-gray-800/50" : "bg-gray-50"} border-b`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                <Label className={esModoOscuro ? "text-white" : "text-[#800040]"}>Período Predefinido</Label>
                <div className="grid grid-cols-2 gap-2">
                  {periodoOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={dateRange.preset === option.value ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${
                        dateRange.preset === option.value
                          ? esModoOscuro
                            ? "bg-[#1d5631] text-white"
                            : "bg-[#800040] text-white"
                          : ""
                      }`}
                      onClick={() => handlePeriodChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-from" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Fecha Inicio
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                  onChange={handleDateFromChange}
                  className={
                    esModoOscuro
                      ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                      : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Fecha Fin
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                  onChange={handleDateToChange}
                  className={
                    esModoOscuro
                      ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                      : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-docente" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  <User className="h-4 w-4 inline mr-2" />
                  Docente
                </Label>
                <Input
                  id="filter-docente"
                  placeholder="Filtrar por docente"
                  value={filters.docente}
                  onChange={(e) => setFilters({ ...filters, docente: e.target.value })}
                  className={
                    esModoOscuro
                      ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                      : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-materia" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Materia
                </Label>
                <Input
                  id="filter-materia"
                  placeholder="Filtrar por materia"
                  value={filters.materia}
                  onChange={(e) => setFilters({ ...filters, materia: e.target.value })}
                  className={
                    esModoOscuro
                      ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                      : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Tabs defaultValue="reporte" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-6">
              <TabsList
                className={`grid w-full grid-cols-2 ${esModoOscuro ? "bg-gray-800" : "bg-gray-100"} rounded-lg p-1`}
              >
                <TabsTrigger
                  value="reporte"
                  className="rounded-md transition-all duration-200 text-gray-700 data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                  style={{
                    color: activeTab === "reporte" ? "white" : esModoOscuro ? "#d1d5db" : "#374151",
                    backgroundColor: activeTab === "reporte" ? (esModoOscuro ? "#1d5631" : "#800040") : "transparent",
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reporte Detallado
                </TabsTrigger>
                <TabsTrigger
                  value="estadisticas"
                  className="rounded-md transition-all duration-200 text-gray-700 data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                  style={{
                    color: activeTab === "estadisticas" ? "white" : esModoOscuro ? "#d1d5db" : "#374151",
                    backgroundColor:
                      activeTab === "estadisticas" ? (esModoOscuro ? "#1d5631" : "#800040") : "transparent",
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Estadísticas
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Acciones de exportación */}
            <div className="flex justify-between items-center px-6 pt-4">
              <Badge
                variant="outline"
                className={`${esModoOscuro ? "border-[#1d5631] text-[#2a7a45]" : "border-[#800040] text-[#800040]"} flex items-center`}
              >
                <Search className="h-3 w-3 mr-1" />
                {filteredPractices.length} registros encontrados
              </Badge>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={exportToExcel}
                        disabled={filteredPractices.length === 0 || exportLoading !== null}
                        className={`${
                          esModoOscuro
                            ? "border-[#1d5631] text-[#1d5631] hover:bg-[#1d5631]/10"
                            : "border-[#800040] text-[#800040] hover:bg-[#800040]/10"
                        } transition-all duration-200`}
                      >
                        {exportLoading === "excel" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                        )}
                        Excel
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exportar datos a Excel</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        onClick={exportToPDF}
                        disabled={filteredPractices.length === 0 || exportLoading !== null}
                        className={esModoOscuro ? "bg-[#1d5631] hover:bg-[#153d23]" : "bg-[#800040] hover:bg-[#5c002e]"}
                      >
                        {exportLoading === "pdf" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        PDF
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exportar datos a PDF</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <TabsContent value="reporte" className="p-6 pt-4">
              <div
                ref={reportTableRef}
                className={`rounded-lg border ${esModoOscuro ? "border-gray-700" : "border-gray-200"} overflow-hidden shadow-md`}
              >
                <div
                  className={`${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} text-white p-6 text-center`}
                >
                  <h2 className="text-2xl font-bold">Instituto Tecnológico Superior</h2>
                  <p className="text-lg mt-1">Reporte de Uso de Laboratorio</p>
                  <p className="text-sm mt-2 text-white/80">
                    {dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }) : "Inicio"} -
                    {dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }) : "Fin"}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className={esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"}>
                      <TableRow>
                        <TableHead className="text-white font-medium">Fecha</TableHead>
                        <TableHead className="text-white font-medium">Docente</TableHead>
                        <TableHead className="text-white font-medium">Materia</TableHead>
                        <TableHead className="text-white font-medium">Nombre de Práctica</TableHead>
                        <TableHead className="text-white font-medium">Grupo y Semestre</TableHead>
                        <TableHead className="text-white font-medium text-right">Número de Alumnos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPractices.length > 0 ? (
                        filteredPractices.map((practice, index) => (
                          <TableRow
                            key={practice.id}
                            className={`
                              ${
                                index % 2 === 0
                                  ? esModoOscuro
                                    ? "bg-gray-800"
                                    : "bg-white"
                                  : esModoOscuro
                                    ? "bg-[#1d5631]/10"
                                    : "bg-[#fff0f5]"
                              }
                              ${esModoOscuro ? "hover:bg-[#1d5631]/20" : "hover:bg-[#fff0f5]/70"}
                              transition-colors
                            `}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Calendar
                                  className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                                />
                                {formatDate(practice.fecha)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <User
                                  className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                                />
                                {`${practice.maestroNombre} ${practice.maestroApellido}`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <BookOpen
                                  className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                                />
                                {practice.materia}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={practice.practica}>
                              {practice.practica}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <div className="flex items-center">
                                <School
                                  className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                                />
                                {Array.from(new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`))).join(
                                  ", ",
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={`${esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"} shadow-sm`}>
                                <Users className="h-3 w-3 mr-1" />
                                {practice.totalAsistencias}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            {loading ? (
                              <div className="flex flex-col items-center justify-center">
                                <RefreshCw
                                  className={`h-10 w-10 animate-spin ${esModoOscuro ? "text-[#1d5631]" : "text-[#800040]"}`}
                                />
                                <p className="mt-4 text-lg">Cargando registros...</p>
                                <p className="text-sm text-gray-500 mt-1">Esto puede tomar unos momentos</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <Search className={`h-10 w-10 ${esModoOscuro ? "text-[#1d5631]" : "text-[#800040]"}`} />
                                <p className="mt-4 text-lg">No hay registros para mostrar</p>
                                <p className="text-sm text-gray-500 mt-1">Intenta ajustar los filtros de búsqueda</p>
                                <Button
                                  variant="outline"
                                  className="mt-4"
                                  onClick={() => {
                                    setFilters({ docente: "", materia: "", grupoSemestre: "" })
                                    handlePeriodChange("last3")
                                  }}
                                >
                                  Limpiar filtros
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className={`p-6 border-t ${esModoOscuro ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className={`p-6 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/40 text-white" : "bg-[#fff0f5] text-[#800040]"} flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-105 duration-200`}
                    >
                      <div className={`rounded-full p-3 mb-2 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#800040]/10"}`}>
                        <FileText className={`h-6 w-6 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                      </div>
                      <p className="text-sm font-medium">Total de prácticas</p>
                      <p className={`text-3xl font-bold ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}>
                        {totalPractices}
                      </p>
                    </div>
                    <div
                      className={`p-6 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/40 text-white" : "bg-[#fff0f5] text-[#800040]"} flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-105 duration-200`}
                    >
                      <div className={`rounded-full p-3 mb-2 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#800040]/10"}`}>
                        <Users className={`h-6 w-6 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                      </div>
                      <p className="text-sm font-medium">Total de alumnos</p>
                      <p className={`text-3xl font-bold ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}>
                        {totalStudents}
                      </p>
                    </div>
                    <div
                      className={`p-6 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/40 text-white" : "bg-[#fff0f5] text-[#800040]"} flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-105 duration-200`}
                    >
                      <div className={`rounded-full p-3 mb-2 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#800040]/10"}`}>
                        <BarChart3 className={`h-6 w-6 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                      </div>
                      <p className="text-sm font-medium">Promedio de alumnos</p>
                      <p className={`text-3xl font-bold ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}>
                        {averageStudents}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-6 border-t ${esModoOscuro ? "border-gray-700" : "border-gray-200"} text-center`}>
                  <div className="mt-8 inline-block border-t border-gray-300 pt-4 w-64">
                    <p className={esModoOscuro ? "text-gray-300" : "text-gray-600"}>
                      Firma del Responsable de Laboratorio
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="estadisticas" className="p-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Materias con más prácticas */}
                <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                  <CardHeader
                    className={`pb-2 ${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} text-white rounded-t-lg`}
                  >
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Materias con más prácticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {topMaterias.length > 0 ? (
                      <div className="space-y-4">
                        {topMaterias.map(([materia, stats], index) => (
                          <div key={materia} className="flex items-center">
                            <div className="w-8 text-center font-bold">{index + 1}</div>
                            <div
                              className={`flex-1 h-10 rounded-md flex items-center px-3 ${
                                esModoOscuro
                                  ? "bg-[#1d5631]/30 text-white font-medium"
                                  : "bg-[#fff0f5] text-[#800040] font-medium"
                              }`}
                            >
                              <span className="truncate">{materia}</span>
                            </div>
                            <div className="ml-2 text-right">
                              <Badge className={esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"}>
                                {stats.count} prácticas
                              </Badge>
                              <div className={`text-xs mt-1 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                                {stats.students} alumnos
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">No hay datos disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Docentes con más prácticas */}
                <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                  <CardHeader
                    className={`pb-2 ${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} text-white rounded-t-lg`}
                  >
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Docentes con más prácticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {topDocentes.length > 0 ? (
                      <div className="space-y-4">
                        {topDocentes.map(([docente, stats], index) => (
                          <div key={docente} className="flex items-center">
                            <div className="w-8 text-center font-bold">{index + 1}</div>
                            <div
                              className={`flex-1 h-10 rounded-md flex items-center px-3 ${
                                esModoOscuro
                                  ? "bg-[#1d5631]/30 text-white font-medium"
                                  : "bg-[#fff0f5] text-[#800040] font-medium"
                              }`}
                            >
                              <span className="truncate">{docente}</span>
                            </div>
                            <div className="ml-2 text-right">
                              <Badge className={esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"}>
                                {stats.count} prácticas
                              </Badge>
                              <div className={`text-xs mt-1 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                                {stats.students} alumnos
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">No hay datos disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Carreras con más estudiantes */}
                <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                  <CardHeader
                    className={`pb-2 ${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} text-white rounded-t-lg`}
                  >
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <School className="h-5 w-5" />
                      Carreras con más estudiantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {topCarreras.length > 0 ? (
                      <div className="space-y-4">
                        {topCarreras.map(([carrera, count], index) => (
                          <div key={carrera} className="flex items-center">
                            <div className="w-8 text-center font-bold">{index + 1}</div>
                            <div
                              className={`flex-1 h-10 rounded-md flex items-center px-3 ${
                                esModoOscuro
                                  ? "bg-[#1d5631]/30 text-white font-medium"
                                  : "bg-[#fff0f5] text-[#800040] font-medium"
                              }`}
                            >
                              <span className="truncate">{carrera}</span>
                            </div>
                            <div className="ml-2 text-right">
                              <Badge className={esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"}>
                                {count} estudiantes
                              </Badge>
                              <div className={`text-xs mt-1 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                                {((count / totalStudents) * 100).toFixed(1)}% del total
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">No hay datos disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resumen del período */}
                <Card
                  className={`md:col-span-1 ${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}
                >
                  <CardHeader
                    className={`pb-2 ${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} text-white rounded-t-lg`}
                  >
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Resumen del período
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/40" : "bg-[#fff0f5]"} flex items-center justify-between`}
                      >
                        <div className="flex items-center">
                          <div className={`rounded-full p-2 ${esModoOscuro ? "bg-[#1d5631]/60" : "bg-[#800040]/10"}`}>
                            <FileText className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          </div>
                          <span className={`ml-3 font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                            Total de prácticas
                          </span>
                        </div>
                        <span className={`text-xl font-bold ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}>
                          {totalPractices}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/40" : "bg-[#fff0f5]"} flex items-center justify-between`}
                      >
                        <div className="flex items-center">
                          <div className={`rounded-full p-2 ${esModoOscuro ? "bg-[#1d5631]/60" : "bg-[#800040]/10"}`}>
                            <Users className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          </div>
                          <span className={`ml-3 font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                            Total de estudiantes
                          </span>
                        </div>
                        <span className={`text-xl font-bold ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}>
                          {totalStudents}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/40" : "bg-[#fff0f5]"} flex items-center justify-between`}
                      >
                        <div className="flex items-center">
                          <div className={`rounded-full p-2 ${esModoOscuro ? "bg-[#1d5631]/60" : "bg-[#800040]/10"}`}>
                            <BookOpen className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          </div>
                          <span className={`ml-3 font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                            Materias diferentes
                          </span>
                        </div>
                        <span className={`text-xl font-bold ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}>
                          {Object.keys(materiaStats).length}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/40" : "bg-[#fff0f5]"} flex items-center justify-between`}
                      >
                        <div className="flex items-center">
                          <div className={`rounded-full p-2 ${esModoOscuro ? "bg-[#1d5631]/60" : "bg-[#800040]/10"}`}>
                            <User className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          </div>
                          <span className={`ml-3 font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                            Docentes participantes
                          </span>
                        </div>
                        <span className={`text-xl font-bold ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}>
                          {Object.keys(docenteStats).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter
          className={`p-4 ${esModoOscuro ? "bg-gray-800/50" : "bg-gray-50"} border-t flex justify-between items-center`}
        >
          <div className="text-sm text-gray-500">
            Reporte generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
