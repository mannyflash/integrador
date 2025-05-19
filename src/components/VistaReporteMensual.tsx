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
  Info,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Download,
  Eye,
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
  const [activeTab, setActiveTab] = useState("datos")
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: "success" | "error"
  }>({ show: false, message: "", type: "success" })

  // Nuevos estados para el formato ITSPP
  const [nombreResponsable, setNombreResponsable] = useState("B.P.")
  const [division, setDivision] = useState("DIVISIÓN DE INGENIERÍA EN SISTEMAS COMPUTACIONALES")
  const [subdireccion, setSubdireccion] = useState("SUBDIRECCIÓN ACADÉMICA")
  const [laboratorio, setLaboratorio] = useState("LABORATORIO DE REDES")
  const [showConfiguracion, setShowConfiguracion] = useState(false)

  // Lista de docentes y materias para filtros
  const [docentesList, setDocentesList] = useState<string[]>([])
  const [materiasList, setMateriasList] = useState<string[]>([])
  const [selectedDocente, setSelectedDocente] = useState<string>("")
  const [selectedMateria, setSelectedMateria] = useState<string>("")

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

      // Extraer lista de docentes y materias para los filtros
      const docentes = Array.from(new Set(datosInfoClase.map((p) => `${p.maestroNombre} ${p.maestroApellido}`)))
      const materias = Array.from(new Set(datosInfoClase.map((p) => p.materia)))

      setDocentesList(docentes)
      setMateriasList(materias)

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

    // Apply docente filter from dropdown
    if (selectedDocente) {
      filtered = filtered.filter(
        (practice) => `${practice.maestroNombre} ${practice.maestroApellido}` === selectedDocente,
      )
    }
    // Apply materia filter from dropdown
    else if (selectedMateria) {
      filtered = filtered.filter((practice) => practice.materia === selectedMateria)
    }
    // Apply text filters if dropdown filters are not used
    else {
      if (filters.docente) {
        filtered = filtered.filter((practice) =>
          `${practice.maestroNombre} ${practice.maestroApellido}`.toLowerCase().includes(filters.docente.toLowerCase()),
        )
      }

      if (filters.materia) {
        filtered = filtered.filter((practice) => practice.materia.toLowerCase().includes(filters.materia.toLowerCase()))
      }
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

  // Manejar cambio de docente
  const handleDocenteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocente(e.target.value)
    if (e.target.value) {
      setSelectedMateria("")
    }
  }

  // Manejar cambio de materia
  const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMateria(e.target.value)
    if (e.target.value) {
      setSelectedDocente("")
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

  // Agrupar prácticas por docente y materia para el formato ITSPP
  const practicasPorDocenteMateria = filteredPractices.reduce(
    (acc, practice) => {
      const docenteKey = `${practice.maestroNombre} ${practice.maestroApellido}`
      const materiaKey = practice.materia

      if (!acc[docenteKey]) {
        acc[docenteKey] = {}
      }

      if (!acc[docenteKey][materiaKey]) {
        acc[docenteKey][materiaKey] = {
          practicas: [],
          totalAlumnos: 0,
        }
      }

      acc[docenteKey][materiaKey].practicas.push(practice)
      acc[docenteKey][materiaKey].totalAlumnos += practice.totalAsistencias

      return acc
    },
    {} as Record<string, Record<string, { practicas: InfoClase[]; totalAlumnos: number }>>,
  )

  // Function to export to Excel with formato ITSPP
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

      // Crear datos para la hoja en formato ITSPP
      const reporteData = [
        ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"],
        [division],
        [subdireccion],
        [laboratorio],
        [""],
        ["PERIODO:", periodoTexto.toUpperCase()],
        [""],
        ["FECHA", "DOCENTE", "MATERIA", "PRÁCTICA", "GRUPO Y SEMESTRE", "NUM. DE ALUMNOS"],
      ]

      // Agregar datos de prácticas
      filteredPractices.forEach((practice) => {
        const gruposSemestres = Array.from(new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`))).join(
          ", ",
        )

        reporteData.push([
          formatDate(practice.fecha),
          `${practice.maestroNombre} ${practice.maestroApellido}`,
          practice.materia,
          practice.practica,
          gruposSemestres,
          practice.totalAsistencias.toString(),
        ])
      })

      // Agregar totales
      reporteData.push(
        [""],
        ["TOTAL DE PRÁCTICAS:", filteredPractices.length.toString()],
        ["TOTAL DE ALUMNOS ATENDIDOS:", totalStudents.toString()],
        ["PROMEDIO DE ALUMNOS POR PRÁCTICA:", averageStudents.toString()],
        [""],
        ["NOMBRE Y FIRMA DE RESPONSABLE DE LABORATORIO:", nombreResponsable],
      )

      // Crear hoja
      const sheet = utils.aoa_to_sheet(reporteData)

      // Aplicar estilos a la hoja (mediante ancho de columnas)
      sheet["!cols"] = [
        { wch: 15 }, // Fecha
        { wch: 25 }, // Docente
        { wch: 25 }, // Materia
        { wch: 30 }, // Práctica
        { wch: 20 }, // Grupo/Semestre
        { wch: 15 }, // Alumnos
      ]

      // Agregar la hoja al libro
      utils.book_append_sheet(workbook, sheet, "Reporte Laboratorio")

      // Generate filename with date range
      const fromDateFilename = dateRange.from ? format(dateRange.from, "dd-MM-yyyy") : "inicio"
      const toDateFilename = dateRange.to ? format(dateRange.to, "dd-MM-yyyy") : "fin"
      const filename = `Reporte_Laboratorio_${fromDateFilename}_a_${toDateFilename}.xlsx`

      // Guardar el archivo
      writeFile(workbook, filename)
      await logAction("export_excel", `Exported ${filteredPractices.length} records to Excel with ITSPP format`)
      showNotification(`Reporte exportado a Excel correctamente`, "success")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      showNotification("Error al exportar a Excel", "error")
    } finally {
      setExportLoading(null)
    }
  }

  // Function to export to PDF con formato ITSPP
  const exportToPDF = async () => {
    try {
      setExportLoading("pdf")

      // Formatear fechas para el título
      const fromDate = dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }).toUpperCase() : "INICIO"
      const toDate = dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }).toUpperCase() : "FIN"
      const periodoTexto = `${fromDate} AL ${toDate}`

      // Crear un nuevo documento PDF
      const doc = new jsPDF({
        orientation: "landscape",
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

      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10

      // Añadir logos
      // Añadir logos con manejo de errores
      try {
        // Logo TecNM en la esquina superior izquierda
        doc.addImage("/FondoItspp.png", "PNG", 5, 5, 40, 40)
      } catch (error) {
        console.warn("No se pudo cargar la imagen FondoItspp.png:", error)
        // Continuar sin la imagen
      }

      try {
        // Logo ITSPP en la esquina superior derecha
        doc.addImage("/LogoSistemas.png", "PNG", pageWidth - 70, 10, 50, 40)
      } catch (error) {
        console.warn("No se pudo cargar la imagen LogoSistemas.png:", error)
      }

      // Encabezado
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO", pageWidth / 2, 20, { align: "center" })

      doc.setFontSize(10)
      doc.text(division, pageWidth / 2, 26, { align: "center" })
      doc.text(subdireccion, pageWidth / 2, 32, { align: "center" })
      doc.text(laboratorio, pageWidth / 2, 38, { align: "center" })

      // Periodo
      doc.setFontSize(10)
      doc.text("PERIODO:", 20, 50)
      doc.text(periodoTexto, 70, 50)

      // Calcular promedio de alumnos
      const promedioAlumnos = totalPractices > 0 ? (totalStudents / totalPractices).toFixed(1) : "0"

      // Crear tabla con los datos
      const tableColumn = ["FECHA", "DOCENTE", "MATERIA", "PRÁCTICA", "GRUPO Y SEMESTRE", "NUM. DE ALUMNOS"]

      // Preparar datos para la tabla
      const tableData = filteredPractices.map((practice) => [
        formatDate(practice.fecha),
        `${practice.maestroNombre} ${practice.maestroApellido}`,
        practice.materia,
        practice.practica,
        Array.from(new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`))).join(", "),
        practice.totalAsistencias.toString(),
      ])

      // Configurar la tabla
      doc.autoTable({
        head: [tableColumn],
        body: tableData,
        startY: 60,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [255, 255, 255], // Cambiar a blanco
          textColor: [0, 0, 0], // Cambiar a negro
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Fecha
          1: { cellWidth: 40 }, // Docente
          2: { cellWidth: 40 }, // Materia
          3: { cellWidth: 50 }, // Práctica
          4: { cellWidth: 40 }, // Grupo y Semestre
          5: { cellWidth: 20, halign: "center" }, // Num. de Alumnos
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255], // Cambiar a blanco
        },
      })

      // Agregar información de totales y promedio
      const finalY = (doc as any).lastAutoTable.finalY + 10

      doc.text("PROMEDIO DE NÚMERO DE ALUMNOS:", 20, finalY)
      doc.text(promedioAlumnos, 100, finalY)

      doc.text("NÚMERO TOTAL DE PRÁCTICAS:", 20, finalY + 7)
      doc.text(totalPractices.toString(), 100, finalY + 7)

      // Firma del responsable
      doc.text("NOMBRE Y FIRMA DE RESPONSABLE DE LABORATORIO", pageWidth / 2, finalY + 30, { align: "center" })
      doc.line(pageWidth / 2 - 40, finalY + 50, pageWidth / 2 + 40, finalY + 50)
      doc.text(nombreResponsable, pageWidth / 2, finalY + 60, { align: "center" })

      // Sello de educación (simulado con texto)
      doc.setFontSize(8)
      doc.text("SELLO EDUCACIÓN", 50, pageHeight - 20)


      // Generar nombre de archivo
      const fromDateFilename = dateRange.from ? format(dateRange.from, "MM-yyyy") : "inicio"
      const toDateFilename = dateRange.to ? format(dateRange.to, "MM-yyyy") : "fin"
      const filename = `Reporte_Laboratorio_${fromDateFilename}_a_${toDateFilename}.pdf`

      // Guardar el archivo
      doc.save(filename)

      await logAction("export_pdf", `Exported ${filteredPractices.length} records to PDF with ITSPP format`)
      showNotification(`Reporte exportado a PDF correctamente`, "success")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      showNotification("Error al exportar a PDF", "error")
    } finally {
      setExportLoading(null)
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFilters({ docente: "", materia: "", grupoSemestre: "" })
    setSelectedDocente("")
    setSelectedMateria("")
    handlePeriodChange("current")
  }

  // Load records on initial render
  useEffect(() => {
    fetchRecords()
  }, [])

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters()
  }, [dateRange, filters, selectedDocente, selectedMateria])

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
                <FileText className="h-6 w-6" />
                Generador de Reportes Mensuales
              </CardTitle>
              <CardDescription className="text-white/80 mt-1">
                Genera reportes mensuales de uso del laboratorio en formato ITSPP
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className={`${esModoOscuro ? "bg-white/20 hover:bg-white/30" : "bg-white/20 hover:bg-white/30"} text-white transition-all duration-200 shadow-sm`}
                onClick={() => fetchRecords()}
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {loading ? "Cargando..." : "Actualizar datos"}
              </Button>
              <Button
                className={`${esModoOscuro ? "bg-white/20 hover:bg-white/30" : "bg-white/20 hover:bg-white/30"} text-white transition-all duration-200 shadow-sm`}
                onClick={() => setShowConfiguracion(!showConfiguracion)}
              >
                <Sliders className="h-4 w-4 mr-2" />
                Configuración
                <ChevronDown
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${showConfiguracion ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Panel de configuración */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showConfiguracion ? "max-h-[300px]" : "max-h-0"
          }`}
        >
          <div className={`p-4 ${esModoOscuro ? "bg-gray-800/50" : "bg-gray-50"} border-b`}>
            <h3 className={`text-sm font-medium mb-3 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              Configuración del Formato ITSPP
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-responsable" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  <User className="h-4 w-4 inline mr-2" />
                  Nombre del Responsable
                </Label>
                <Input
                  id="nombre-responsable"
                  placeholder="Nombre del responsable"
                  value={nombreResponsable}
                  onChange={(e) => setNombreResponsable(e.target.value)}
                  className={
                    esModoOscuro
                      ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                      : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="division" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  División
                </Label>
                <Input
                  id="division"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className={
                    esModoOscuro
                      ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                      : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdireccion" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  Subdirección
                </Label>
                <Input
                  id="subdireccion"
                  value={subdireccion}
                  onChange={(e) => setSubdireccion(e.target.value)}
                  className={
                    esModoOscuro
                      ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                      : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laboratorio" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                  Laboratorio
                </Label>
                <Input
                  id="laboratorio"
                  value={laboratorio}
                  onChange={(e) => setLaboratorio(e.target.value)}
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

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Panel de filtros - Ocupa 4 columnas en pantallas medianas o más grandes */}
            <Card className={`md:col-span-4 ${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Filter className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                  Filtros del Reporte
                </CardTitle>
                <CardDescription>Selecciona los filtros para generar el reporte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Periodo */}
                <div className="space-y-2">
                  <Label className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Período
                  </Label>
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

                {/* Fechas personalizadas */}
                {dateRange.preset === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date-from" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
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
                  </div>
                )}

                {/* Docente */}
                <div className="space-y-2">
                  <Label htmlFor="select-docente" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    <User className="h-4 w-4 inline mr-2" />
                    Docente
                  </Label>
                  <select
                    id="select-docente"
                    value={selectedDocente}
                    onChange={handleDocenteChange}
                    className={`w-full rounded-md ${
                      esModoOscuro
                        ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                        : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                    } h-10 px-3`}
                  >
                    <option value="">Todos los docentes</option>
                    {docentesList.map((docente) => (
                      <option key={docente} value={docente}>
                        {docente}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Materia */}
                <div className="space-y-2">
                  <Label htmlFor="select-materia" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    <BookOpen className="h-4 w-4 inline mr-2" />
                    Materia
                  </Label>
                  <select
                    id="select-materia"
                    value={selectedMateria}
                    onChange={handleMateriaChange}
                    className={`w-full rounded-md ${
                      esModoOscuro
                        ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                        : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                    } h-10 px-3`}
                  >
                    <option value="">Todas las materias</option>
                    {materiasList.map((materia) => (
                      <option key={materia} value={materia}>
                        {materia}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grupo/Semestre */}
                <div className="space-y-2">
                  <Label htmlFor="filter-grupo-semestre" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    <School className="h-4 w-4 inline mr-2" />
                    Grupo o Semestre
                  </Label>
                  <Input
                    id="filter-grupo-semestre"
                    placeholder="Filtrar por grupo o semestre"
                    value={filters.grupoSemestre}
                    onChange={(e) => setFilters({ ...filters, grupoSemestre: e.target.value })}
                    className={
                      esModoOscuro
                        ? "bg-gray-700 border-gray-600 text-white focus-visible:ring-[#1d5631]"
                        : "bg-[#fff0f5] border-[#800040]/30 focus-visible:ring-[#800040]"
                    }
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col gap-2 pt-4">
                  <Button variant="outline" onClick={limpiarFiltros} className="w-full">
                    Limpiar filtros
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel de resultados - Ocupa 8 columnas en pantallas medianas o más grandes */}
            <div className="md:col-span-8 space-y-6">
              {/* Tarjetas de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                          Prácticas
                        </p>
                        <p className={`text-3xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {totalPractices}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-[#800040]/10"}`}>
                        <FileText className={`h-6 w-6 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                          Estudiantes
                        </p>
                        <p className={`text-3xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {totalStudents}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-[#800040]/10"}`}>
                        <Users className={`h-6 w-6 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                          Promedio
                        </p>
                        <p className={`text-3xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {averageStudents}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-[#800040]/10"}`}>
                        <BarChart3 className={`h-6 w-6 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs para datos y estadísticas */}
              <Tabs defaultValue="datos" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList
                  className={`grid w-full grid-cols-2 ${esModoOscuro ? "bg-gray-800" : "bg-gray-100"} rounded-lg p-1`}
                >
                  <TabsTrigger
                    value="datos"
                    className="rounded-md transition-all duration-200 text-gray-700 data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    style={{
                      color: activeTab === "datos" ? "white" : esModoOscuro ? "#d1d5db" : "#374151",
                      backgroundColor: activeTab === "datos" ? (esModoOscuro ? "#1d5631" : "#800040") : "transparent",
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa
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

                <TabsContent value="datos" className="pt-4">
                  <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-medium">Vista previa de datos</CardTitle>
                        <Badge
                          variant="outline"
                          className={`${esModoOscuro ? "border-[#1d5631] text-[#2a7a45]" : "border-[#800040] text-[#800040]"} flex items-center`}
                        >
                          <Search className="h-3 w-3 mr-1" />
                          {filteredPractices.length} registros
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className={esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"}>
                            <TableRow>
                              <TableHead className="text-white font-medium">Fecha</TableHead>
                              <TableHead className="text-white font-medium">Docente</TableHead>
                              <TableHead className="text-white font-medium">Materia</TableHead>
                              <TableHead className="text-white font-medium">Práctica</TableHead>
                              <TableHead className="text-white font-medium text-right">Alumnos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPractices.length > 0 ? (
                              filteredPractices.slice(0, 10).map((practice, index) => (
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
                                  <TableCell className="font-medium">{formatDate(practice.fecha)}</TableCell>
                                  <TableCell>{`${practice.maestroNombre} ${practice.maestroApellido}`}</TableCell>
                                  <TableCell>{practice.materia}</TableCell>
                                  <TableCell className="max-w-[200px] truncate" title={practice.practica}>
                                    {practice.practica}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge className={`${esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"} shadow-sm`}>
                                      {practice.totalAsistencias}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
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
                                      <Search
                                        className={`h-10 w-10 ${esModoOscuro ? "text-[#1d5631]" : "text-[#800040]"}`}
                                      />
                                      <p className="mt-4 text-lg">No hay registros para mostrar</p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        Intenta ajustar los filtros de búsqueda
                                      </p>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {filteredPractices.length > 10 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Mostrando 10 de {filteredPractices.length} registros. Exporta a Excel o PDF para ver todos.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vista previa del formato ITSPP */}
                  {filteredPractices.length > 0 && (
                    <Card className={`mt-6 ${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-medium">Vista previa del formato ITSPP</CardTitle>
                          <Badge
                            variant="outline"
                            className={`${esModoOscuro ? "border-[#1d5631] text-[#2a7a45]" : "border-[#800040] text-[#800040]"} flex items-center`}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Exportar para ver completo
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h2 className="text-center text-lg font-bold uppercase">
                                Instituto Tecnológico Superior de Puerto Peñasco
                              </h2>
                              <p className="text-center text-xs font-medium mt-1">{division}</p>
                              <p className="text-center text-xs font-medium">{subdireccion}</p>
                              <p className="text-center text-xs font-medium">{laboratorio}</p>
                            </div>
                            <div className="w-24">
                              <img src="/logo-itspp.png" alt="Logo ITSPP" className="h-12 w-auto" />
                            </div>
                          </div>

                          <div className="mt-4 text-xs">
                            <div className="font-bold">
                              PERIODO:{" "}
                              {dateRange.from ? format(dateRange.from, "dd MMMM yyyy", { locale: es }) : "Inicio"} -{" "}
                              {dateRange.to ? format(dateRange.to, "dd MMMM yyyy", { locale: es }) : "Fin"}
                            </div>
                          </div>

                          <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#800040] text-white">
                                  <th className="border border-gray-300 p-1">FECHA</th>
                                  <th className="border border-gray-300 p-1">DOCENTE</th>
                                  <th className="border border-gray-300 p-1">MATERIA</th>
                                  <th className="border border-gray-300 p-1">PRÁCTICA</th>
                                  <th className="border border-gray-300 p-1">GRUPO Y SEMESTRE</th>
                                  <th className="border border-gray-300 p-1">NUM. DE ALUMNOS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPractices.slice(0, 3).map((practice, index) => (
                                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-[#fff0f5]"}>
                                    <td className="border border-gray-300 p-1">{formatDate(practice.fecha)}</td>
                                    <td className="border border-gray-300 p-1">{`${practice.maestroNombre} ${practice.maestroApellido}`}</td>
                                    <td className="border border-gray-300 p-1">{practice.materia}</td>
                                    <td className="border border-gray-300 p-1">{practice.practica}</td>
                                    <td className="border border-gray-300 p-1">
                                      {Array.from(
                                        new Set(practice.alumnos.map((a) => `${a.grupo} (${a.semestre})`)),
                                      ).join(", ")}
                                    </td>
                                    <td className="border border-gray-300 p-1 text-center">
                                      {practice.totalAsistencias}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 text-center text-xs text-gray-500">
                            <p>Vista previa limitada. Exporta a PDF o Excel para ver el reporte completo.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="estadisticas" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Materias con más prácticas */}
                    <Card className={`${esModoOscuro ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                          <BookOpen className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
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
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                          <User className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
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
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>

        <CardFooter
          className={`p-4 ${esModoOscuro ? "bg-gray-800/50" : "bg-gray-50"} border-t flex justify-between items-center`}
        >
          <div className="text-sm text-gray-500">
            Generador de reportes actualizado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </div>
          <div className="text-sm">
            <Badge variant="outline" className="font-normal">
              Formato ITSPP
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
